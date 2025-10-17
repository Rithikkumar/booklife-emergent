-- Fix infinite recursion in community_members RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view community members" ON community_members;

-- Create a fixed policy that doesn't cause recursion
-- Instead of checking membership in community_members (which causes recursion),
-- we'll use a simpler approach
CREATE POLICY "Users can view community members" 
  ON community_members 
  FOR SELECT 
  USING (
    -- Always allow users to see their own membership records
    user_id = auth.uid()
    OR
    -- Allow viewing members of public communities
    community_id IN (SELECT id FROM communities WHERE is_public = true)
  );

-- Also create a security definer function to safely check membership
-- This avoids the recursion issue
CREATE OR REPLACE FUNCTION public.is_user_member_of_community(user_uuid uuid, community_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members 
    WHERE user_id = user_uuid 
    AND community_id = community_uuid
  );
$$;