-- Fix infinite recursion in profiles RLS policy by updating the SELECT policy
DROP POLICY IF EXISTS "Users can view public profiles or their own" ON public.profiles;

CREATE POLICY "Users can view public profiles or their own" 
ON public.profiles 
FOR SELECT 
USING (
  NOT is_private 
  OR user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM followers 
    WHERE followers.following_id = profiles.user_id 
    AND followers.follower_id = auth.uid()
  )
);

-- Insert dummy user profile for testing
INSERT INTO public.profiles (
  user_id, 
  username, 
  display_name, 
  bio, 
  is_private
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test',
  'Test User',
  'Dummy user for testing',
  false
) ON CONFLICT (user_id) DO NOTHING;