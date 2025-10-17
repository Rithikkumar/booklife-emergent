-- Complete fix for infinite recursion in communities and community_members
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public communities are viewable by everyone" ON communities;
DROP POLICY IF EXISTS "Members can view private communities they belong to" ON communities;
DROP POLICY IF EXISTS "Users can view their own created communities" ON communities;
DROP POLICY IF EXISTS "Community admins can update communities" ON communities;
DROP POLICY IF EXISTS "Users can create communities" ON communities;

-- Drop all community_members policies that cause recursion
DROP POLICY IF EXISTS "Users can view community members" ON community_members;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;
DROP POLICY IF EXISTS "Community admins can remove members" ON community_members;
DROP POLICY IF EXISTS "Community admins can update member roles" ON community_members;

-- Create simple, non-recursive policies for communities
CREATE POLICY "Anyone can view all public communities" 
ON communities FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view communities they created" 
ON communities FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create new communities" 
ON communities FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their communities" 
ON communities FOR UPDATE 
USING (created_by = auth.uid());

-- Create simple, non-recursive policies for community_members
CREATE POLICY "Anyone can view members of public communities" 
ON community_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM communities c WHERE c.id = community_id AND c.is_public = true));

CREATE POLICY "Users can view their own memberships" 
ON community_members FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join any community" 
ON community_members FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities they joined" 
ON community_members FOR DELETE 
USING (user_id = auth.uid());