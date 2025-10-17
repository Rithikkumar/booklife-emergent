-- Complete cleanup of all community-related data
-- Delete in correct order to respect foreign key constraints

-- 1. Delete all community recommendations
DELETE FROM community_recommendations;

-- 2. Delete all community messages
DELETE FROM community_messages;

-- 3. Delete all community members
DELETE FROM community_members;

-- 4. Delete all user community interactions
DELETE FROM user_community_interactions;

-- 5. Delete all communities (parent table - delete last)
DELETE FROM communities;