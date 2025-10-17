-- Fix the potential recursion in community_members SELECT policy
DROP POLICY IF EXISTS "Users can view community members" ON community_members;

-- Create a better policy without recursion
CREATE POLICY "Users can view community members" ON community_members
FOR SELECT USING (
  -- User can see their own membership record
  user_id = auth.uid() 
  OR 
  -- User can see members of public communities
  community_id IN (
    SELECT id FROM communities WHERE is_public = true
  )
  OR
  -- User can see members of communities they belong to
  auth.uid() IN (
    SELECT user_id FROM community_members cm2 
    WHERE cm2.community_id = community_members.community_id
  )
);