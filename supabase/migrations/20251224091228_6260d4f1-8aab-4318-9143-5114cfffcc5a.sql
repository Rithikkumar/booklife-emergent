-- Drop existing DELETE policies and create new ones with 1-hour restriction

-- 1. Community Messages - Update DELETE policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON community_messages;

CREATE POLICY "Users can delete their own messages within 1 hour"
ON community_messages FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - interval '1 hour')
);

-- 2. Direct Messages - Update DELETE policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON direct_messages;

CREATE POLICY "Users can delete their own messages within 1 hour"
ON direct_messages FOR DELETE
USING (
  sender_id = auth.uid() 
  AND created_at > (now() - interval '1 hour')
);

-- 3. Chat Messages (group chat) - Update DELETE policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

CREATE POLICY "Users can delete their own messages within 1 hour"
ON chat_messages FOR DELETE
USING (
  auth.uid() = sender_id 
  AND created_at > (now() - interval '1 hour')
);