-- Security Enhancement Phase 1: Fix RLS Policy Recursion and Admin System

-- Step 1: Create security definer functions to break policy recursion
CREATE OR REPLACE FUNCTION public.is_user_in_community(user_id_param uuid, community_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM community_members 
        WHERE user_id = user_id_param AND community_id = community_id_param
    );
$$;

CREATE OR REPLACE FUNCTION public.is_user_in_book_club(user_id_param uuid, club_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM book_club_members 
        WHERE user_id = user_id_param AND club_id = club_id_param
    );
$$;

CREATE OR REPLACE FUNCTION public.is_user_class_participant(user_id_param uuid, class_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM class_participants 
        WHERE user_id = user_id_param AND class_id = class_id_param
    );
$$;

CREATE OR REPLACE FUNCTION public.is_class_owner(user_id_param uuid, class_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE user_id = user_id_param AND id = class_id_param
    );
$$;

-- Step 2: Add admin role to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Step 3: Create admin role checker function
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = user_id_param AND role = 'admin'
    );
$$;

-- Step 4: Create author documents access log table
CREATE TABLE IF NOT EXISTS author_document_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    application_id uuid NOT NULL,
    document_type text NOT NULL,
    access_time timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- Enable RLS on the audit log
ALTER TABLE author_document_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view document access logs"
ON author_document_access_log
FOR SELECT
USING (public.is_admin());

-- Step 5: Drop and recreate problematic RLS policies

-- Fix community_members policies
DROP POLICY IF EXISTS "Users can view community members" ON community_members;
CREATE POLICY "Users can view community members"
ON community_members
FOR SELECT
USING (
    -- Public communities are visible to all
    (community_id IN (SELECT id FROM communities WHERE is_public = true))
    OR 
    -- User can see their own membership
    (user_id = auth.uid())
    OR
    -- Members can see other members in the same community
    (public.is_user_in_community(auth.uid(), community_id))
);

-- Fix book_club_members policies  
DROP POLICY IF EXISTS "Users can view club members" ON book_club_members;
CREATE POLICY "Users can view club members"
ON book_club_members
FOR SELECT
USING (
    -- Public clubs are visible to all
    (club_id IN (SELECT id FROM book_clubs WHERE is_public = true))
    OR
    -- User can see their own membership
    (user_id = auth.uid())
    OR
    -- Members can see other members in the same club
    (public.is_user_in_book_club(auth.uid(), club_id))
);

-- Fix class_participants policies
DROP POLICY IF EXISTS "Users can view class participants if they're the host or partic" ON class_participants;
CREATE POLICY "Users can view class participants"
ON class_participants
FOR SELECT
USING (
    -- User can see their own participation
    (user_id = auth.uid())
    OR
    -- Class owners can see all participants
    (public.is_class_owner(auth.uid(), class_id))
);

-- Fix book_classes policies
DROP POLICY IF EXISTS "Class owners and participants can view class details" ON book_classes;
CREATE POLICY "Class owners and participants can view class details"
ON book_classes
FOR SELECT
USING (
    -- Class owners can see their classes
    (user_id = auth.uid())
    OR
    -- Participants can see classes they're enrolled in
    (public.is_user_class_participant(auth.uid(), id))
);

-- Step 6: Enhanced author applications security

-- Add admin-only policy for viewing sensitive documents
CREATE POLICY "Admins can view all author applications"
ON author_applications
FOR SELECT
USING (public.is_admin());

-- Create function to log document access
CREATE OR REPLACE FUNCTION public.log_author_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Log document access when sensitive fields are accessed
    INSERT INTO author_document_access_log (
        user_id,
        application_id,
        document_type,
        ip_address
    ) VALUES (
        auth.uid(),
        NEW.id,
        'application_view',
        inet_client_addr()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for document access logging
DROP TRIGGER IF EXISTS log_author_document_access_trigger ON author_applications;
CREATE TRIGGER log_author_document_access_trigger
    AFTER SELECT ON author_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.log_author_document_access();

-- Step 7: Create secure admin function for creating admin users (for initial setup)
CREATE OR REPLACE FUNCTION public.create_admin_user(target_user_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only allow if no admins exist yet (bootstrap case) or caller is already admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') 
       OR public.is_admin() THEN
        UPDATE profiles 
        SET role = 'admin' 
        WHERE user_id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can create other admins';
    END IF;
END;
$$;