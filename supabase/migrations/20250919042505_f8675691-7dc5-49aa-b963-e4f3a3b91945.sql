-- Add trigger to automatically update community member count
CREATE OR REPLACE FUNCTION public.update_community_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'community_members' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE communities 
            SET 
                member_count = (
                    SELECT COUNT(*) 
                    FROM community_members 
                    WHERE community_id = NEW.community_id
                ),
                updated_at = now()
            WHERE id = NEW.community_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE communities 
            SET 
                member_count = (
                    SELECT COUNT(*) 
                    FROM community_members 
                    WHERE community_id = OLD.community_id
                ),
                updated_at = now()
            WHERE id = OLD.community_id;
            RETURN OLD;
        END IF;
    END IF;
    
    IF TG_TABLE_NAME = 'community_messages' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE communities 
            SET 
                activity_score = COALESCE(activity_score, 0) + 1,
                updated_at = now()
            WHERE id = NEW.community_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE communities 
            SET 
                activity_score = GREATEST(COALESCE(activity_score, 0) - 1, 0),
                updated_at = now()
            WHERE id = OLD.community_id;
            RETURN OLD;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic stats updates
DROP TRIGGER IF EXISTS update_community_member_stats ON community_members;
CREATE TRIGGER update_community_member_stats
    AFTER INSERT OR DELETE ON community_members
    FOR EACH ROW EXECUTE FUNCTION update_community_stats();

DROP TRIGGER IF EXISTS update_community_message_stats ON community_messages;  
CREATE TRIGGER update_community_message_stats
    AFTER INSERT OR DELETE ON community_messages
    FOR EACH ROW EXECUTE FUNCTION update_community_stats();

-- Add function to get community analytics data
CREATE OR REPLACE FUNCTION public.get_community_analytics(p_community_id uuid)
RETURNS TABLE(
    member_count bigint,
    message_count bigint,
    last_activity timestamp with time zone,
    active_members_count bigint,
    recent_messages_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM community_members WHERE community_id = p_community_id),
        (SELECT COUNT(*) FROM community_messages WHERE community_id = p_community_id),
        (SELECT MAX(created_at) FROM community_messages WHERE community_id = p_community_id),
        (SELECT COUNT(DISTINCT user_id) FROM community_messages 
         WHERE community_id = p_community_id 
         AND created_at > now() - interval '30 days'),
        (SELECT COUNT(*) FROM community_messages 
         WHERE community_id = p_community_id 
         AND created_at > now() - interval '7 days');
END;
$$;