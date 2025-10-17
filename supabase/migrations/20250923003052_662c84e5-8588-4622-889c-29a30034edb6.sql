-- Check and fix RLS policies for communities table
-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Authenticated users can view public communities" ON communities;

-- Create a more permissive policy for viewing public communities
CREATE POLICY "Anyone can view public communities" ON communities
FOR SELECT USING (is_public = true);

-- Also allow authenticated users to view communities they're members of (private communities)
CREATE POLICY "Members can view their communities" ON communities  
FOR SELECT USING (
  id IN (
    SELECT community_id FROM community_members WHERE user_id = auth.uid()
  )
);