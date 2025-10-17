-- Step 2: Add community members now that communities exist
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