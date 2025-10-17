-- Fix infinite recursion in communities RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
DROP POLICY IF EXISTS "Members can view their communities" ON communities;

-- Create simple, non-recursive policies
CREATE POLICY "Public communities are viewable by everyone" 
ON communities FOR SELECT 
USING (is_public = true);

CREATE POLICY "Members can view private communities they belong to" 
ON communities FOR SELECT 
USING (
  NOT is_public 
  AND id IN (
    SELECT community_id 
    FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own created communities" 
ON communities FOR SELECT 
USING (created_by = auth.uid());