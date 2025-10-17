-- Phase 1: Critical Privacy Fixes - User Profile Privacy Controls

-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'followers'));

-- Update profiles RLS policies to require authentication and respect privacy settings
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- User can see their own profile
  user_id = auth.uid() 
  -- Or profile is public
  OR profile_visibility = 'public'
  -- Or profile is followers-only and user is following
  OR (profile_visibility = 'followers' AND auth.uid() IN (
    SELECT follower_id FROM followers 
    WHERE following_id = profiles.user_id
  ))
);

-- Update communities RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities;

CREATE POLICY "Authenticated users can view public communities"
ON public.communities 
FOR SELECT 
TO authenticated
USING (is_public = true);

-- Update user_books RLS policies to require authentication
DROP POLICY IF EXISTS "Users can view books from public profiles or followed users" ON public.user_books;

CREATE POLICY "Authenticated users can view books with privacy controls"
ON public.user_books 
FOR SELECT 
TO authenticated
USING (
  -- User can see their own books
  user_id = auth.uid()
  -- Or user can see books from public profiles
  OR (user_id IN (
    SELECT user_id FROM profiles 
    WHERE profile_visibility = 'public' AND NOT is_private
  ))
  -- Or user is following the book owner and profile allows followers
  OR (user_id IN (
    SELECT p.user_id FROM profiles p
    JOIN followers f ON f.following_id = p.user_id
    WHERE f.follower_id = auth.uid() 
    AND (p.profile_visibility IN ('public', 'followers') AND NOT p.is_private)
  ))
);

-- Add enhanced credential access auditing
ALTER TABLE public.credential_access_log 
ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS suspicious_activity boolean DEFAULT false;

-- Create function to detect suspicious credential access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_access(p_user_id uuid, p_class_id uuid)
RETURNS boolean AS $$
DECLARE
    recent_attempts integer;
    different_ips integer;
BEGIN
    -- Count recent access attempts (last 1 hour)
    SELECT COUNT(*) INTO recent_attempts
    FROM credential_access_log 
    WHERE user_id = p_user_id 
    AND class_id = p_class_id
    AND created_at > now() - interval '1 hour';
    
    -- Count different IP addresses (last 24 hours)
    SELECT COUNT(DISTINCT ip_address) INTO different_ips
    FROM credential_access_log 
    WHERE user_id = p_user_id 
    AND class_id = p_class_id
    AND created_at > now() - interval '24 hours';
    
    -- Flag as suspicious if more than 5 attempts in 1 hour or more than 3 different IPs in 24 hours
    RETURN (recent_attempts > 5 OR different_ips > 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Update track_credential_access function to include suspicious activity detection
CREATE OR REPLACE FUNCTION public.track_credential_access(p_class_id uuid)
RETURNS void AS $$
DECLARE
    is_suspicious boolean;
BEGIN
    -- Detect suspicious activity
    is_suspicious := detect_suspicious_access(auth.uid(), p_class_id);
    
    -- Update access tracking
    UPDATE class_meeting_credentials 
    SET 
        last_accessed_at = now(),
        access_count = access_count + 1
    WHERE class_id = p_class_id;
    
    -- Log the access with suspicious activity flag
    INSERT INTO credential_access_log (
        class_id, 
        user_id, 
        action, 
        ip_address, 
        suspicious_activity,
        risk_score
    ) VALUES (
        p_class_id, 
        auth.uid(), 
        'ACCESS_TRACKED', 
        inet_client_addr(),
        is_suspicious,
        CASE WHEN is_suspicious THEN 100 ELSE 0 END
    );
    
    -- Log warning for suspicious activity
    IF is_suspicious THEN
        INSERT INTO credential_access_log (
            class_id, 
            user_id, 
            action, 
            ip_address, 
            suspicious_activity,
            risk_score
        ) VALUES (
            p_class_id, 
            auth.uid(), 
            'SUSPICIOUS_ACTIVITY_DETECTED', 
            inet_client_addr(),
            true,
            100
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create function to cleanup expired credentials automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_credentials()
RETURNS void AS $$
BEGIN
    -- Delete expired credentials
    DELETE FROM class_meeting_credentials 
    WHERE expires_at < now();
    
    -- Log cleanup action
    INSERT INTO credential_access_log (
        class_id, 
        user_id, 
        action, 
        ip_address
    ) 
    SELECT 
        uuid_nil(), -- Use nil UUID for system actions
        uuid_nil(),
        'CREDENTIALS_CLEANUP',
        null
    WHERE EXISTS (
        SELECT 1 FROM class_meeting_credentials 
        WHERE expires_at < now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';