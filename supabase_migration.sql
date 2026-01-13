-- =============================================
-- BOOKPASSING DATABASE MIGRATION
-- Add missing foreign key constraints & indexes
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dyzogjengmqoqnpfqnda
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Paste this entire script
-- 5. Click "Run" (or press Ctrl+Enter)
-- =============================================

-- PART 1: Add Foreign Key Constraints
-- These ensure data integrity and enable JOINs in queries

DO $$ 
BEGIN
    -- conversations.participant_1_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_conversations_participant_1') THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT fk_conversations_participant_1 
        FOREIGN KEY (participant_1_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_conversations_participant_1';
    END IF;
    
    -- conversations.participant_2_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_conversations_participant_2') THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT fk_conversations_participant_2 
        FOREIGN KEY (participant_2_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_conversations_participant_2';
    END IF;
    
    -- direct_messages.sender_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_direct_messages_sender') THEN
        ALTER TABLE direct_messages 
        ADD CONSTRAINT fk_direct_messages_sender 
        FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_direct_messages_sender';
    END IF;
    
    -- chat_messages.sender_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_messages_sender') THEN
        ALTER TABLE chat_messages 
        ADD CONSTRAINT fk_chat_messages_sender 
        FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_chat_messages_sender';
    END IF;
    
    -- followers.follower_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_followers_follower') THEN
        ALTER TABLE followers 
        ADD CONSTRAINT fk_followers_follower 
        FOREIGN KEY (follower_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_followers_follower';
    END IF;
    
    -- followers.following_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_followers_following') THEN
        ALTER TABLE followers 
        ADD CONSTRAINT fk_followers_following 
        FOREIGN KEY (following_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_followers_following';
    END IF;
    
    -- notifications.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_notifications_user') THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT fk_notifications_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_notifications_user';
    END IF;
    
    -- user_books.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_books_user') THEN
        ALTER TABLE user_books 
        ADD CONSTRAINT fk_user_books_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_user_books_user';
    END IF;
    
    -- book_codes.created_by -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_codes_created_by') THEN
        ALTER TABLE book_codes 
        ADD CONSTRAINT fk_book_codes_created_by 
        FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_codes_created_by';
    END IF;
    
    -- book_codes.claimed_by -> profiles.user_id (nullable, so SET NULL on delete)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_codes_claimed_by') THEN
        ALTER TABLE book_codes 
        ADD CONSTRAINT fk_book_codes_claimed_by 
        FOREIGN KEY (claimed_by) REFERENCES profiles(user_id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: fk_book_codes_claimed_by';
    END IF;
    
    -- followed_books.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_followed_books_user') THEN
        ALTER TABLE followed_books 
        ADD CONSTRAINT fk_followed_books_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_followed_books_user';
    END IF;
    
    -- book_story_comments.commenter_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_story_comments_commenter') THEN
        ALTER TABLE book_story_comments 
        ADD CONSTRAINT fk_book_story_comments_commenter 
        FOREIGN KEY (commenter_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_story_comments_commenter';
    END IF;
    
    -- book_story_comments.book_id -> user_books.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_story_comments_book') THEN
        ALTER TABLE book_story_comments 
        ADD CONSTRAINT fk_book_story_comments_book 
        FOREIGN KEY (book_id) REFERENCES user_books(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_story_comments_book';
    END IF;
    
    -- book_story_reactions.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_story_reactions_user') THEN
        ALTER TABLE book_story_reactions 
        ADD CONSTRAINT fk_book_story_reactions_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_story_reactions_user';
    END IF;
    
    -- book_story_reactions.book_id -> user_books.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_story_reactions_book') THEN
        ALTER TABLE book_story_reactions 
        ADD CONSTRAINT fk_book_story_reactions_book 
        FOREIGN KEY (book_id) REFERENCES user_books(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_story_reactions_book';
    END IF;
    
    -- chat_room_members.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_room_members_user') THEN
        ALTER TABLE chat_room_members 
        ADD CONSTRAINT fk_chat_room_members_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_chat_room_members_user';
    END IF;
    
    -- chat_rooms.created_by -> profiles.user_id (nullable)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_rooms_created_by') THEN
        ALTER TABLE chat_rooms 
        ADD CONSTRAINT fk_chat_rooms_created_by 
        FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: fk_chat_rooms_created_by';
    END IF;
    
    -- class_chat_messages.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_class_chat_messages_user') THEN
        ALTER TABLE class_chat_messages 
        ADD CONSTRAINT fk_class_chat_messages_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_class_chat_messages_user';
    END IF;
    
    -- book_classes.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_book_classes_user') THEN
        ALTER TABLE book_classes 
        ADD CONSTRAINT fk_book_classes_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_book_classes_user';
    END IF;
    
    -- class_participants.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_class_participants_user') THEN
        ALTER TABLE class_participants 
        ADD CONSTRAINT fk_class_participants_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_class_participants_user';
    END IF;
    
    -- email_notifications.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_email_notifications_user') THEN
        ALTER TABLE email_notifications 
        ADD CONSTRAINT fk_email_notifications_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_email_notifications_user';
    END IF;
    
    -- credential_access_log.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_credential_access_log_user') THEN
        ALTER TABLE credential_access_log 
        ADD CONSTRAINT fk_credential_access_log_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_credential_access_log_user';
    END IF;
    
    -- community_recommendations.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_community_recommendations_user') THEN
        ALTER TABLE community_recommendations 
        ADD CONSTRAINT fk_community_recommendations_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_community_recommendations_user';
    END IF;
    
    -- community_recommendations.community_id -> communities.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_community_recommendations_community') THEN
        ALTER TABLE community_recommendations 
        ADD CONSTRAINT fk_community_recommendations_community 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_community_recommendations_community';
    END IF;
    
    -- user_community_interactions.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_community_interactions_user') THEN
        ALTER TABLE user_community_interactions 
        ADD CONSTRAINT fk_user_community_interactions_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_user_community_interactions_user';
    END IF;
    
    -- user_community_interactions.community_id -> communities.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_community_interactions_community') THEN
        ALTER TABLE user_community_interactions 
        ADD CONSTRAINT fk_user_community_interactions_community 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_user_community_interactions_community';
    END IF;
    
    -- community_join_requests.user_id -> profiles.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_community_join_requests_user') THEN
        ALTER TABLE community_join_requests 
        ADD CONSTRAINT fk_community_join_requests_user 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_community_join_requests_user';
    END IF;
    
    -- community_join_requests.community_id -> communities.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_community_join_requests_community') THEN
        ALTER TABLE community_join_requests 
        ADD CONSTRAINT fk_community_join_requests_community 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: fk_community_join_requests_community';
    END IF;
    
END $$;

-- =============================================
-- PART 2: Add Performance Indexes
-- These speed up common queries
-- =============================================

-- Direct Messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON direct_messages(conversation_id, is_read) WHERE is_read = false;

-- Chat Messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

-- Community Messages indexes
CREATE INDEX IF NOT EXISTS idx_community_messages_community_id ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id ON community_messages(user_id);

-- User Books indexes
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_code ON user_books(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_books_created_at ON user_books(created_at DESC);

-- Followers indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- Community Members indexes
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);

-- Chat Room Members indexes
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Book Classes indexes
CREATE INDEX IF NOT EXISTS idx_book_classes_user_id ON book_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_classes_scheduled_date ON book_classes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_book_classes_status ON book_classes(status);

-- =============================================
-- PART 3: Verification Query
-- Run this to see all new FK constraints
-- =============================================

SELECT 
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
