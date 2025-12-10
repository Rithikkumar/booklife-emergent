-- Simple approach: manually insert test data without relying on triggers
-- First check if data already exists and clear if needed
DELETE FROM community_messages WHERE community_id IN (
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'c3333333-3333-3333-3333-333333333333'::uuid,
  'c4444444-4444-4444-4444-444444444444'::uuid,
  'c5555555-5555-5555-5555-555555555555'::uuid
);

DELETE FROM community_members WHERE community_id IN (
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'c3333333-3333-3333-3333-333333333333'::uuid,
  'c4444444-4444-4444-4444-444444444444'::uuid,
  'c5555555-5555-5555-5555-555555555555'::uuid
);

-- Add community members
INSERT INTO community_members (community_id, user_id, role, engagement_score) VALUES 
-- JavaScript Developers
('c1111111-1111-1111-1111-111111111111'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'admin', 10),
('c1111111-1111-1111-1111-111111111111'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 5),
('c1111111-1111-1111-1111-111111111111'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 3),

-- Book Club Central
('c2222222-2222-2222-2222-222222222222'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'admin', 8),
('c2222222-2222-2222-2222-222222222222'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'member', 6),
('c2222222-2222-2222-2222-222222222222'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 4),
('c2222222-2222-2222-2222-222222222222'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 2),

-- Local Coffee Enthusiasts
('c3333333-3333-3333-3333-333333333333'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'admin', 7),
('c3333333-3333-3333-3333-333333333333'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 4),
('c3333333-3333-3333-3333-333333333333'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 3),

-- Fitness Motivation
('c4444444-4444-4444-4444-444444444444'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'admin', 9),
('c4444444-4444-4444-4444-444444444444'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'member', 5),
('c4444444-4444-4444-4444-444444444444'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 3),

-- Photography Showcase
('c5555555-5555-5555-5555-555555555555'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'admin', 6),
('c5555555-5555-5555-5555-555555555555'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 4),
('c5555555-5555-5555-5555-555555555555'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 2);

-- Manually update member counts
UPDATE communities SET member_count = 3 WHERE id = 'c1111111-1111-1111-1111-111111111111'::uuid;
UPDATE communities SET member_count = 4 WHERE id = 'c2222222-2222-2222-2222-222222222222'::uuid;
UPDATE communities SET member_count = 3 WHERE id = 'c3333333-3333-3333-3333-333333333333'::uuid;
UPDATE communities SET member_count = 3 WHERE id = 'c4444444-4444-4444-4444-444444444444'::uuid;
UPDATE communities SET member_count = 2 WHERE id = 'c5555555-5555-5555-5555-555555555555'::uuid;

-- Add test messages
INSERT INTO community_messages (community_id, user_id, message, message_type, created_at) VALUES 
('c1111111-1111-1111-1111-111111111111'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'Welcome to JavaScript Developers! Feel free to share your latest projects and ask questions.', 'text', now() - interval '2 days'),
('c1111111-1111-1111-1111-111111111111'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'Thanks Alice! I just started learning React. Any good resources you''d recommend?', 'text', now() - interval '1 day'),
('c2222222-2222-2222-2222-222222222222'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'This month we''re reading "The Seven Husbands of Evelyn Hugo". Who''s in?', 'text', now() - interval '3 days'),
('c2222222-2222-2222-2222-222222222222'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'Count me in! I love Taylor Jenkins Reid''s writing style.', 'text', now() - interval '2 days'),
('c3333333-3333-3333-3333-333333333333'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'Just discovered this amazing little cafe on 5th Street. Their espresso is incredible!', 'text', now() - interval '4 hours'),
('c4444444-4444-4444-4444-444444444444'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'Morning everyone! Who''s ready for today''s workout? 💪', 'text', now() - interval '6 hours'),
('c5555555-5555-5555-5555-555555555555'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'Share your best shots from this week! Looking forward to seeing everyone''s creativity 📸', 'text', now() - interval '1 day');