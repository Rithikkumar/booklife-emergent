-- Add SELECT policy so members of private communities can view those communities
CREATE POLICY "Members can view their private communities"
ON public.communities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = communities.id
    AND community_members.user_id = auth.uid()
  )
);