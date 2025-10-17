-- Set default guidelines for existing communities without guidelines
UPDATE public.communities 
SET guidelines = '1. Be respectful to all members
2. No spam or self-promotion
3. Stay on topic
4. Help create a welcoming environment for everyone
5. Report any issues to community moderators'
WHERE guidelines IS NULL OR guidelines = '';

-- Update the trigger function to set default guidelines for new communities
CREATE OR REPLACE FUNCTION public.add_community_creator_as_member()
RETURNS TRIGGER AS $$
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
    ON CONFLICT (community_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;