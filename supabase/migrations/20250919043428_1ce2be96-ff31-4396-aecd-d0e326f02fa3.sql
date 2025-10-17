-- Update RLS policies for admin community management
-- Allow community admins to update community details
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;

CREATE POLICY "Community admins can update communities" 
ON public.communities 
FOR UPDATE 
USING (
  auth.uid() = created_by 
  OR auth.uid() IN (
    SELECT user_id FROM community_members 
    WHERE community_id = communities.id 
    AND role = 'admin'
  )
);

-- Allow community admins to manage members (promote, demote, remove)
CREATE POLICY "Community admins can update member roles" 
ON public.community_members 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT cm.user_id FROM community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.role = 'admin'
  )
);

-- Allow community admins to remove members
CREATE POLICY "Community admins can remove members" 
ON public.community_members 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT cm.user_id FROM community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.role = 'admin'
  )
);

-- Function to check if user is community admin
CREATE OR REPLACE FUNCTION public.is_community_admin(p_user_id uuid, p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM community_members 
        WHERE user_id = p_user_id 
        AND community_id = p_community_id 
        AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM communities 
        WHERE id = p_community_id 
        AND created_by = p_user_id
    );
$$;