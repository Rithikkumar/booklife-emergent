-- Phase 1: Add critical database indexes for community chat performance

-- Index for fetching messages by community (most frequent query)
CREATE INDEX IF NOT EXISTS idx_community_messages_community_created 
ON community_messages(community_id, created_at DESC);

-- Index for user's own messages
CREATE INDEX IF NOT EXISTS idx_community_messages_user_created 
ON community_messages(user_id, created_at DESC);

-- Index for typing indicator cleanup
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires 
ON community_typing_indicators(community_id, expires_at);

-- Index for member activity tracking
CREATE INDEX IF NOT EXISTS idx_community_members_activity 
ON community_members(community_id, last_active_at DESC);

-- Index for reactions (for faster reaction queries)
CREATE INDEX IF NOT EXISTS idx_community_messages_reactions 
ON community_messages USING GIN(reactions);