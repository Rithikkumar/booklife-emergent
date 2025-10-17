-- Create community_messages table for chat functionality
CREATE TABLE public.community_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'announcement')),
    reply_to_id UUID,
    reactions JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for community messages
CREATE POLICY "Users can view messages in communities they're members of" 
ON public.community_messages 
FOR SELECT 
USING (
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
    OR 
    community_id IN (
        SELECT id 
        FROM communities 
        WHERE is_public = true
    )
);

CREATE POLICY "Users can send messages in communities they're members of" 
ON public.community_messages 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own messages" 
ON public.community_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.community_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at DESC);
CREATE INDEX idx_community_messages_user_id ON public.community_messages(user_id);

-- Add foreign key constraints
ALTER TABLE public.community_messages 
ADD CONSTRAINT fk_community_messages_community_id 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE public.community_messages 
ADD CONSTRAINT fk_community_messages_reply_to_id 
FOREIGN KEY (reply_to_id) REFERENCES public.community_messages(id) ON DELETE SET NULL;

-- Create trigger for updating updated_at
CREATE TRIGGER update_community_messages_updated_at
    BEFORE UPDATE ON public.community_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for community messages
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Create function to get community message count
CREATE OR REPLACE FUNCTION public.get_community_message_count(p_community_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER 
    FROM community_messages 
    WHERE community_id = p_community_id;
$$;

-- Create function to get latest community activity
CREATE OR REPLACE FUNCTION public.get_latest_community_activity(p_community_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(
        COALESCE(MAX(created_at), '1970-01-01'::timestamptz),
        COALESCE((SELECT MAX(joined_at) FROM community_members WHERE community_id = p_community_id), '1970-01-01'::timestamptz)
    )
    FROM community_messages 
    WHERE community_id = p_community_id;
$$;