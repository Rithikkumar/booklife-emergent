
-- Step 1: Create a SECURITY DEFINER function to check if a profile is public
-- This breaks the circular dependency between profiles and followers RLS policies
CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = p_user_id
    AND profile_visibility = 'public'
    AND NOT is_private
  );
$$;

-- Step 2: Create a SECURITY DEFINER function to check if user is a follower
-- This breaks the circular dependency from the profiles side
CREATE OR REPLACE FUNCTION public.is_follower_of(p_follower_id uuid, p_following_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM followers
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
  );
$$;

-- Step 3: Drop the problematic followers SELECT policies and recreate without profile reference
DROP POLICY IF EXISTS "Authenticated users can view followers of public profiles" ON public.followers;
DROP POLICY IF EXISTS "Users can view followers and following" ON public.followers;

-- Recreate: users can see their own followers/following + followers of public profiles (using SECURITY DEFINER function)
CREATE POLICY "Users can view followers and following"
ON public.followers FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()
  OR following_id = auth.uid()
  OR is_public_profile(following_id)
);

-- Step 4: Drop and recreate profiles SELECT policy to use SECURITY DEFINER function for follower check
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR profile_visibility = 'public'
  OR (profile_visibility = 'followers' AND is_follower_of(auth.uid(), user_id))
);

-- Step 5: Drop and recreate user_books SELECT policy to use SECURITY DEFINER functions
DROP POLICY IF EXISTS "Authenticated users can view books with privacy controls" ON public.user_books;

CREATE POLICY "Authenticated users can view books with privacy controls"
ON public.user_books FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_public_profile(user_id)
  OR (is_follower_of(auth.uid(), user_id) AND (SELECT profile_visibility FROM profiles WHERE profiles.user_id = user_books.user_id) IN ('public', 'followers'))
);
