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

-- Create dummy user in auth.users table first
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@example.com',
  crypt('test', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

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