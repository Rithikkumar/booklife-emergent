-- Create function to automatically add community creator as admin member
CREATE OR REPLACE FUNCTION public.add_community_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the creator as an admin member of the community
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (community_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically add creator as member when community is created
CREATE TRIGGER add_creator_as_member_trigger
    AFTER INSERT ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.add_community_creator_as_member();

-- Add guidelines column to communities table
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS guidelines TEXT;