-- Create community join requests table
CREATE TABLE public.community_join_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_join_requests
CREATE POLICY "Users can create join requests" 
ON public.community_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own join requests" 
ON public.community_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Community admins can view join requests for their communities" 
ON public.community_join_requests 
FOR SELECT 
USING (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    ) OR 
    community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Community admins can update join requests for their communities" 
ON public.community_join_requests 
FOR UPDATE 
USING (
    community_id IN (
        SELECT id FROM communities 
        WHERE created_by = auth.uid()
    ) OR 
    community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create function to auto-approve join requests when community becomes public
CREATE OR REPLACE FUNCTION public.handle_community_privacy_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- If community becomes public, auto-approve all pending join requests
    IF OLD.is_public = false AND NEW.is_public = true THEN
        -- Auto-approve pending requests and add users to community
        INSERT INTO community_members (community_id, user_id, role)
        SELECT 
            NEW.id,
            cjr.user_id,
            'member'
        FROM community_join_requests cjr
        WHERE cjr.community_id = NEW.id 
        AND cjr.status = 'pending'
        ON CONFLICT (community_id, user_id) DO NOTHING;
        
        -- Update request status
        UPDATE community_join_requests 
        SET 
            status = 'approved',
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            updated_at = now()
        WHERE community_id = NEW.id 
        AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for community privacy changes
CREATE TRIGGER on_community_privacy_change
    AFTER UPDATE ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_community_privacy_change();

-- Create function to handle join request approval
CREATE OR REPLACE FUNCTION public.approve_join_request(
    p_request_id UUID,
    p_approve BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_community_id UUID;
    v_user_id UUID;
BEGIN
    -- Get request details and verify admin permission
    SELECT community_id, user_id INTO v_community_id, v_user_id
    FROM community_join_requests
    WHERE id = p_request_id
    AND community_id IN (
        SELECT id FROM communities WHERE created_by = auth.uid()
        UNION
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
    
    IF v_community_id IS NULL THEN
        RAISE EXCEPTION 'Join request not found or insufficient permissions';
    END IF;
    
    -- Update request status
    UPDATE community_join_requests
    SET 
        status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_request_id;
    
    -- If approved, add user to community
    IF p_approve THEN
        INSERT INTO community_members (community_id, user_id, role)
        VALUES (v_community_id, v_user_id, 'member')
        ON CONFLICT (community_id, user_id) DO NOTHING;
    END IF;
END;
$function$;

-- Add updated_at trigger
CREATE TRIGGER update_community_join_requests_updated_at
    BEFORE UPDATE ON public.community_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();