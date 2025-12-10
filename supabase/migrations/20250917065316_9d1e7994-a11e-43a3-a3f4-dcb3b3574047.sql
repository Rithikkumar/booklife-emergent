-- Fix community joining functionality

-- First, let's recreate the member count trigger function with proper permissions
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;

-- Create the trigger
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

-- Ensure RLS policies are correct for community_members
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;
DROP POLICY IF EXISTS "Users can view community members" ON community_members;

-- Recreate policies with proper permissions
CREATE POLICY "Users can join communities" 
  ON community_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
  ON community_members 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view community members" 
  ON community_members 
  FOR SELECT 
  USING (
    -- Users can see members in public communities
    community_id IN (SELECT id FROM communities WHERE is_public = true)
    OR 
    -- Users can see members in communities they belong to
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

-- Fix member counts for existing communities
UPDATE communities 
SET member_count = (
  SELECT COUNT(*) 
  FROM community_members 
  WHERE community_members.community_id = communities.id
);

-- Enable RLS on community_members if not already enabled
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;