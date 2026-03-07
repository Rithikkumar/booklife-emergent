
-- Fix followers SELECT policy to allow viewing complete follower/following lists
-- for public profiles. Previously, only rows where following_id was a public profile
-- were visible to third parties, causing incomplete "Following" counts and lists.

DROP POLICY IF EXISTS "Users can view followers and following" ON public.followers;

CREATE POLICY "Users can view followers and following"
ON public.followers
FOR SELECT
USING (
  follower_id = auth.uid()
  OR following_id = auth.uid()
  OR is_public_profile(following_id)
  OR is_public_profile(follower_id)
);
