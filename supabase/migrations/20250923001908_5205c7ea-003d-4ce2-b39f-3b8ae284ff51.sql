-- Fix the infinite recursion issue in community_members RLS policies
-- Drop the problematic policies and recreate them properly
DROP POLICY IF EXISTS "Users can view community members" ON community_members;
DROP POLICY IF EXISTS "Community admins can update member roles" ON community_members;
DROP POLICY IF EXISTS "Community admins can remove members" ON community_members;

-- Recreate policies without recursion
CREATE POLICY "Users can view community members" ON community_members
FOR SELECT USING (
  user_id = auth.uid() 
  OR 
  community_id IN (
    SELECT id FROM communities WHERE is_public = true
  )
  OR
  community_id IN (
    SELECT community_id FROM community_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Community admins can update member roles" ON community_members
FOR UPDATE USING (
  -- Community creator can update member roles
  community_id IN (
    SELECT id FROM communities WHERE created_by = auth.uid()
  )
  OR
  -- Community admins can update member roles (but not recursive check)
  auth.uid() IN (
    SELECT user_id FROM community_members 
    WHERE community_id = community_members.community_id 
    AND role = 'admin'
    AND user_id != community_members.user_id  -- Avoid self-reference
  )
);

CREATE POLICY "Community admins can remove members" ON community_members
FOR DELETE USING (
  -- Community creator can remove members
  community_id IN (
    SELECT id FROM communities WHERE created_by = auth.uid()
  )
  OR
  -- Community admins can remove members (but not recursive check)
  auth.uid() IN (
    SELECT user_id FROM community_members cm
    WHERE cm.community_id = community_members.community_id 
    AND cm.role = 'admin'
    AND cm.user_id != community_members.user_id  -- Avoid self-reference
  )
);