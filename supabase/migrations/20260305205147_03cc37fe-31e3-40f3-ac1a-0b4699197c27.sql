-- Add RLS policies to book_passes table
ALTER TABLE public.book_passes ENABLE ROW LEVEL SECURITY;

-- Users can view book passes they are involved in
CREATE POLICY "Users can view their own book passes"
ON public.book_passes
FOR SELECT
TO authenticated
USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Users can create book passes
CREATE POLICY "Users can create book passes"
ON public.book_passes
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Users can update book passes they created
CREATE POLICY "Users can update their own book passes"
ON public.book_passes
FOR UPDATE
TO authenticated
USING (from_user_id = auth.uid());

-- Users can delete book passes they created
CREATE POLICY "Users can delete their own book passes"
ON public.book_passes
FOR DELETE
TO authenticated
USING (from_user_id = auth.uid());

-- Fix followers visibility: allow anyone authenticated to view follower relationships for public profiles
CREATE POLICY "Authenticated users can view followers of public profiles"
ON public.followers
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid() 
  OR following_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = followers.following_id 
    AND (profiles.profile_visibility = 'public' AND NOT profiles.is_private)
  )
);