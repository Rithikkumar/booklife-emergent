-- Fix infinite recursion in RLS policies by simplifying the followers policy
-- The issue is circular dependency between profiles and followers policies

-- Drop the problematic policy on followers table
DROP POLICY IF EXISTS "Users can view their own followers/following" ON followers;

-- Create a simpler policy that doesn't reference profiles table
CREATE POLICY "Users can view followers and following" 
ON followers 
FOR SELECT 
USING (
  (follower_id = auth.uid()) OR 
  (following_id = auth.uid())
);

-- Also fix the profiles policy to be more efficient
DROP POLICY IF EXISTS "Users can view public profiles or their own" ON profiles;

-- Create a simpler profiles policy that avoids the circular reference
CREATE POLICY "Users can view profiles" 
ON profiles 
FOR SELECT 
USING (
  (NOT is_private) OR 
  (user_id = auth.uid()) OR 
  (auth.uid() IN (
    SELECT follower_id 
    FROM followers 
    WHERE following_id = profiles.user_id
  ))
);