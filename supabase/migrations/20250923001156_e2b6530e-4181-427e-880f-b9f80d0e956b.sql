-- Add messaging restriction field to communities table
ALTER TABLE public.communities 
ADD COLUMN restrict_messaging BOOLEAN NOT NULL DEFAULT false;

-- Update the community_messages RLS policy to respect messaging restrictions
DROP POLICY IF EXISTS "Users can send messages in communities they're members of" ON public.community_messages;

CREATE POLICY "Users can send messages in communities they're members of" 
ON public.community_messages 
FOR INSERT 
WITH CHECK (
    (auth.uid() = user_id) 
    AND 
    (community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    ))
    AND
    -- Allow messaging if:
    -- 1. Community doesn't restrict messaging, OR
    -- 2. User is the community creator, OR  
    -- 3. User is a community admin
    (
        community_id IN (
            SELECT id FROM communities 
            WHERE restrict_messaging = false
        )
        OR
        community_id IN (
            SELECT id FROM communities 
            WHERE created_by = auth.uid()
        )
        OR
        community_id IN (
            SELECT community_id FROM community_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
);

-- Create function to check if user can send messages in community
CREATE OR REPLACE FUNCTION public.can_user_send_messages(
    p_user_id UUID,
    p_community_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT 
        -- User must be a member
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE user_id = p_user_id AND community_id = p_community_id
        )
        AND
        -- Allow messaging if community doesn't restrict OR user is creator/admin
        (
            -- Community allows all members to message
            EXISTS (
                SELECT 1 FROM communities 
                WHERE id = p_community_id AND restrict_messaging = false
            )
            OR
            -- User is the community creator
            EXISTS (
                SELECT 1 FROM communities 
                WHERE id = p_community_id AND created_by = p_user_id
            )
            OR
            -- User is a community admin
            EXISTS (
                SELECT 1 FROM community_members 
                WHERE user_id = p_user_id 
                AND community_id = p_community_id 
                AND role = 'admin'
            )
        );
$$;