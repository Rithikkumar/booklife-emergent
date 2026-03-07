
-- Create SECURITY DEFINER function to check community membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
    AND user_id = p_user_id
  );
$$;

-- Create SECURITY DEFINER function to check if community is public without triggering RLS
CREATE OR REPLACE FUNCTION public.is_public_community(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM communities
    WHERE id = p_community_id
    AND is_public = true
  );
$$;

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Members can view their private communities" ON public.communities;
DROP POLICY IF EXISTS "Anyone can view members of public communities" ON public.community_members;

-- Recreate communities policy using SECURITY DEFINER function
CREATE POLICY "Members can view their private communities"
ON public.communities
FOR SELECT
USING (
  is_community_member(id, auth.uid())
);

-- Recreate community_members policy using SECURITY DEFINER function
CREATE POLICY "Anyone can view members of public communities"
ON public.community_members
FOR SELECT
USING (
  is_public_community(community_id)
);
