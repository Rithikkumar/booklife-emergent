-- Create test communities with realistic data
-- Insert 5 diverse test communities
INSERT INTO communities (id, name, description, tags, created_by, is_public, member_count) VALUES 
(
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'JavaScript Developers',
  'A community for JavaScript developers to share knowledge and discuss the latest trends in web development',
  ARRAY['javascript', 'programming', 'web-development', 'react', 'nodejs'],
  '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, -- Alice Cooper
  true,
  0
),
(
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'Book Club Central',
  'Join our monthly book discussions and discover new authors together',
  ARRAY['books', 'reading', 'literature', 'discussion', 'fiction'],
  '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, -- Bob Martin
  true,
  0
),
(
  'c3333333-3333-3333-3333-333333333333'::uuid,
  'Local Coffee Enthusiasts',
  'Discover the best coffee shops in town and share brewing tips with fellow coffee lovers',
  ARRAY['coffee', 'local', 'food', 'community', 'cafe'],
  '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, -- Carol Smith
  true,
  0
),
(
  'c4444444-4444-4444-4444-444444444444'::uuid,
  'Fitness Motivation',
  'Stay motivated on your fitness journey with supportive community members',
  ARRAY['fitness', 'health', 'motivation', 'lifestyle', 'workout'],
  'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, -- Test User
  true,
  0
),
(
  'c5555555-5555-5555-5555-555555555555'::uuid,
  'Photography Showcase',
  'Share your photos, get feedback, and learn new techniques from fellow photographers',
  ARRAY['photography', 'art', 'creative', 'showcase', 'visual'],
  '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, -- Alice Cooper
  true,
  0
);

-- Add community members (creators automatically become members via trigger if it exists, but we'll add explicitly)
INSERT INTO community_members (community_id, user_id, role, engagement_score) VALUES 
-- JavaScript Developers members
('c1111111-1111-1111-1111-111111111111'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'admin', 10), -- Alice (creator)
('c1111111-1111-1111-1111-111111111111'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 5), -- Bob
('c1111111-1111-1111-1111-111111111111'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 3), -- Test User

-- Book Club Central members  
('c2222222-2222-2222-2222-222222222222'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'admin', 8), -- Bob (creator)
('c2222222-2222-2222-2222-222222222222'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'member', 6), -- Carol
('c2222222-2222-2222-2222-222222222222'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 4), -- Alice
('c2222222-2222-2222-2222-222222222222'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 2), -- Test User

-- Local Coffee Enthusiasts members
('c3333333-3333-3333-3333-333333333333'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'admin', 7), -- Carol (creator)  
('c3333333-3333-3333-3333-333333333333'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 4), -- Alice
('c3333333-3333-3333-3333-333333333333'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 3), -- Bob

-- Fitness Motivation members
('c4444444-4444-4444-4444-444444444444'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'admin', 9), -- Test User (creator)
('c4444444-4444-4444-4444-444444444444'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'member', 5), -- Carol
('c4444444-4444-4444-4444-444444444444'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'member', 3), -- Alice

-- Photography Showcase members
('c5555555-5555-5555-5555-555555555555'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'admin', 6), -- Alice (creator)
('c5555555-5555-5555-5555-555555555555'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'member', 4), -- Bob
('c5555555-5555-5555-5555-555555555555'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'member', 2); -- Test User

-- Add some test messages to show community activity
INSERT INTO community_messages (community_id, user_id, message, message_type, created_at) VALUES 
-- JavaScript Developers messages
('c1111111-1111-1111-1111-111111111111'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'Welcome to JavaScript Developers! Feel free to share your latest projects and ask questions.', 'text', now() - interval '2 days'),
('c1111111-1111-1111-1111-111111111111'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'Thanks Alice! I just started learning React. Any good resources you''d recommend?', 'text', now() - interval '1 day'),
('c1111111-1111-1111-1111-111111111111'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'The official React docs are great! Also check out React.dev for the latest updates.', 'text', now() - interval '20 hours'),

-- Book Club Central messages
('c2222222-2222-2222-2222-222222222222'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'This month we''re reading "The Seven Husbands of Evelyn Hugo". Who''s in?', 'text', now() - interval '3 days'),
('c2222222-2222-2222-2222-222222222222'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'Count me in! I love Taylor Jenkins Reid''s writing style.', 'text', now() - interval '2 days'),
('c2222222-2222-2222-2222-222222222222'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'I''m halfway through already! No spoilers please 📚', 'text', now() - interval '1 day'),

-- Local Coffee Enthusiasts messages  
('c3333333-3333-3333-3333-333333333333'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'Just discovered this amazing little cafe on 5th Street. Their espresso is incredible!', 'text', now() - interval '4 hours'),
('c3333333-3333-3333-3333-333333333333'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'Oh I know that place! Their pastries are amazing too ☕', 'text', now() - interval '2 hours'),

-- Fitness Motivation messages
('c4444444-4444-4444-4444-444444444444'::uuid, 'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, 'Morning everyone! Who''s ready for today''s workout? 💪', 'text', now() - interval '6 hours'),
('c4444444-4444-4444-4444-444444444444'::uuid, '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, 'Just finished a 5k run! Feeling energized for the day ahead.', 'text', now() - interval '3 hours'),

-- Photography Showcase messages
('c5555555-5555-5555-5555-555555555555'::uuid, '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, 'Share your best shots from this week! Looking forward to seeing everyone''s creativity 📸', 'text', now() - interval '1 day'),
('c5555555-5555-5555-5555-555555555555'::uuid, '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, 'Finally got that golden hour shot I''ve been trying to capture for weeks!', 'text', now() - interval '12 hours');