-- Add foreign key constraints for data integrity
ALTER TABLE community_messages 
ADD CONSTRAINT fk_community_messages_community 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_messages 
ADD CONSTRAINT fk_community_messages_user 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE community_messages 
ADD CONSTRAINT fk_community_messages_reply 
FOREIGN KEY (reply_to_id) REFERENCES community_messages(id) ON DELETE CASCADE;

ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_community 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_user 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add performance indexes
CREATE INDEX idx_community_messages_community_created 
ON community_messages(community_id, created_at DESC);

CREATE INDEX idx_community_messages_reply_to 
ON community_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

CREATE INDEX idx_community_members_activity 
ON community_members(community_id, last_active_at DESC);

-- Add message length constraint via trigger
CREATE OR REPLACE FUNCTION validate_message_content()
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(NEW.message) = 0 THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;
    
    IF LENGTH(NEW.message) > 2000 THEN
        RAISE EXCEPTION 'Message cannot exceed 2000 characters';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_message_before_insert
    BEFORE INSERT OR UPDATE ON community_messages
    FOR EACH ROW
    EXECUTE FUNCTION validate_message_content();

-- Create typing indicators table
CREATE TABLE community_typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 seconds'),
    UNIQUE(community_id, user_id)
);

-- Enable RLS on typing indicators
ALTER TABLE community_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for typing indicators
CREATE POLICY "Users can view typing indicators in their communities"
ON community_typing_indicators
FOR SELECT
USING (
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their own typing indicators"
ON community_typing_indicators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add cleanup function for expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM community_typing_indicators 
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for community_members and typing_indicators
ALTER TABLE community_members REPLICA IDENTITY FULL;
ALTER TABLE community_typing_indicators REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
ALTER PUBLICATION supabase_realtime ADD TABLE community_typing_indicators;