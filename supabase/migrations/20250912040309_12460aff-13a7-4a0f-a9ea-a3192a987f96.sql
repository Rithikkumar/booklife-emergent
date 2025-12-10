-- Create two additional test users and comprehensive book dataset

-- Insert test users into auth.users (using service role privileges)
-- User 2: bookworm
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'bookworm@example.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "bookworm", "display_name": "Sarah the Bookworm"}',
  'authenticated',
  'authenticated'
);

-- User 3: reader123  
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'reader123@example.com', 
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "reader123", "display_name": "Mike Reader"}',
  'authenticated',
  'authenticated'
);

-- Create profiles for the new users
INSERT INTO profiles (user_id, username, display_name, bio, is_private) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'bookworm', 'Sarah the Bookworm', 'Avid reader who loves fantasy and sci-fi adventures!', false),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'reader123', 'Mike Reader', 'Casual reader exploring different genres.', false);

-- Insert comprehensive book dataset across all three users

-- User 1 (existing test user) - Fiction, Mystery, Romance
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'Paris', ARRAY['classic', 'drama', 'social-justice'], 'purchased', 'A timeless classic about justice and morality', now() - interval '15 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'The Girl with the Dragon Tattoo', 'Stieg Larsson', 'Mystery', 'London', ARRAY['thriller', 'crime', 'nordic-noir'], 'borrowed', 'Gripping Swedish crime thriller', now() - interval '8 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'Pride and Prejudice', 'Jane Austen', 'Romance', 'New York', ARRAY['classic', 'regency', 'witty'], 'gift', 'Beloved romance with Elizabeth and Darcy', now() - interval '22 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'Gone Girl', 'Gillian Flynn', 'Mystery', 'Chicago', ARRAY['psychological', 'thriller', 'dark'], 'purchased', 'Mind-bending psychological thriller', now() - interval '5 days');

-- User 2 (bookworm) - Fantasy, Sci-Fi, Non-Fiction  
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dune', 'Frank Herbert', 'Sci-Fi', 'Tokyo', ARRAY['space-opera', 'politics', 'ecology'], 'purchased', 'Epic sci-fi masterpiece about power and ecology', now() - interval '3 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'The Lord of the Rings', 'J.R.R. Tolkien', 'Fantasy', 'Sydney', ARRAY['epic', 'adventure', 'mythology'], 'purchased', 'The ultimate fantasy epic', now() - interval '12 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 'Berlin', ARRAY['history', 'anthropology', 'evolution'], 'borrowed', 'Fascinating look at human evolution and society', now() - interval '18 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'Edinburgh', ARRAY['magic', 'coming-of-age', 'school'], 'gift', 'The beginning of the magical journey', now() - interval '25 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Neuromancer', 'William Gibson', 'Sci-Fi', 'Hong Kong', ARRAY['cyberpunk', 'ai', 'hacking'], 'purchased', 'Groundbreaking cyberpunk novel', now() - interval '1 day');

-- User 3 (reader123) - Romance, Mystery, Mixed genres
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES  
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'The Notebook', 'Nicholas Sparks', 'Romance', 'Barcelona', ARRAY['contemporary', 'emotional', 'love-story'], 'purchased', 'Heartwarming love story', now() - interval '10 days'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 'Rome', ARRAY['magic', 'storytelling', 'adventure'], 'borrowed', 'Beautiful fantasy with excellent prose', now() - interval '6 days'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Educated', 'Tara Westover', 'Non-Fiction', 'Prague', ARRAY['memoir', 'education', 'family'], 'gift', 'Powerful memoir about education and family', now() - interval '20 days'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Me Before You', 'Jojo Moyes', 'Romance', 'Vienna', ARRAY['contemporary', 'emotional', 'disability'], 'purchased', 'Emotional contemporary romance', now() - interval '14 days');