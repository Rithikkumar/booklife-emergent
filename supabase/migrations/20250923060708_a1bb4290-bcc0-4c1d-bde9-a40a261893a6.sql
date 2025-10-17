-- First, let's ensure the trigger function works correctly
CREATE OR REPLACE FUNCTION public.add_community_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Set default guidelines if none provided
    IF NEW.guidelines IS NULL OR NEW.guidelines = '' THEN
        NEW.guidelines := '1. Be respectful to all members
2. No spam or self-promotion  
3. Stay on topic
4. Help create a welcoming environment for everyone
5. Report any issues to community moderators';
    END IF;
    
    -- Insert the creator as an admin member of the community
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';
    
    RETURN NEW;
END;
$function$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS add_creator_as_member ON public.communities;
CREATE TRIGGER add_creator_as_member
    AFTER INSERT ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.add_community_creator_as_member();

-- Fix existing communities by adding creators as admin members
INSERT INTO public.community_members (community_id, user_id, role)
SELECT c.id, c.created_by, 'admin'
FROM public.communities c
WHERE NOT EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = c.id AND cm.user_id = c.created_by
)
ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';