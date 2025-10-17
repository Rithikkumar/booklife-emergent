-- First, let's drop and recreate the trigger to fix any issues
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;

-- Recreate the trigger properly
CREATE OR REPLACE TRIGGER update_community_member_count_trigger
    AFTER INSERT OR DELETE ON community_members
    FOR EACH ROW
    EXECUTE FUNCTION update_community_member_count();

-- Now create test communities
INSERT INTO communities (id, name, description, tags, created_by, is_public) VALUES 
(
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'JavaScript Developers',
  'A community for JavaScript developers to share knowledge and discuss the latest trends in web development',
  ARRAY['javascript', 'programming', 'web-development', 'react', 'nodejs'],
  '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, -- Alice Cooper
  true
),
(
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'Book Club Central',
  'Join our monthly book discussions and discover new authors together',
  ARRAY['books', 'reading', 'literature', 'discussion', 'fiction'],
  '25bee99a-acb8-41ef-b1e4-f99748a92096'::uuid, -- Bob Martin
  true
),
(
  'c3333333-3333-3333-3333-333333333333'::uuid,
  'Local Coffee Enthusiasts',
  'Discover the best coffee shops in town and share brewing tips with fellow coffee lovers',
  ARRAY['coffee', 'local', 'food', 'community', 'cafe'],
  '1001abd5-7386-478a-bf13-1a2a8ce98a2d'::uuid, -- Carol Smith
  true
),
(
  'c4444444-4444-4444-4444-444444444444'::uuid,
  'Fitness Motivation',
  'Stay motivated on your fitness journey with supportive community members',
  ARRAY['fitness', 'health', 'motivation', 'lifestyle', 'workout'],
  'f7abfeb6-93f6-47d0-ac85-44e86703bdfa'::uuid, -- Test User
  true
),
(
  'c5555555-5555-5555-5555-555555555555'::uuid,
  'Photography Showcase',
  'Share your photos, get feedback, and learn new techniques from fellow photographers',
  ARRAY['photography', 'art', 'creative', 'showcase', 'visual'],
  '13cef7f1-da08-4357-b6bf-acc2a7b71880'::uuid, -- Alice Cooper
  true
);