-- Insert comprehensive book dataset across all three users

-- User 1 (existing test user) - Fiction, Mystery, Romance
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'Paris', ARRAY['classic', 'drama', 'social-justice'], 'purchased', 'A timeless classic about justice and morality', now() - interval '15 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'The Girl with the Dragon Tattoo', 'Stieg Larsson', 'Mystery', 'London', ARRAY['thriller', 'crime', 'nordic-noir'], 'borrowed', 'Gripping Swedish crime thriller', now() - interval '8 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'Pride and Prejudice', 'Jane Austen', 'Romance', 'New York', ARRAY['classic', 'regency', 'witty'], 'gift', 'Beloved romance with Elizabeth and Darcy', now() - interval '22 days'),
('f7abfeb6-93f6-47d0-ac85-44e86703bdfa', 'Gone Girl', 'Gillian Flynn', 'Mystery', 'Chicago', ARRAY['psychological', 'thriller', 'dark'], 'purchased', 'Mind-bending psychological thriller', now() - interval '5 days');

-- User 2 (bookworm) - Fantasy, Sci-Fi, Non-Fiction  
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES
('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'Dune', 'Frank Herbert', 'Sci-Fi', 'Tokyo', ARRAY['space-opera', 'politics', 'ecology'], 'purchased', 'Epic sci-fi masterpiece about power and ecology', now() - interval '3 days'),
('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'The Lord of the Rings', 'J.R.R. Tolkien', 'Fantasy', 'Sydney', ARRAY['epic', 'adventure', 'mythology'], 'purchased', 'The ultimate fantasy epic', now() - interval '12 days'),
('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 'Berlin', ARRAY['history', 'anthropology', 'evolution'], 'borrowed', 'Fascinating look at human evolution and society', now() - interval '18 days'),
('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'Edinburgh', ARRAY['magic', 'coming-of-age', 'school'], 'gift', 'The beginning of the magical journey', now() - interval '25 days'),
('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'Neuromancer', 'William Gibson', 'Sci-Fi', 'Hong Kong', ARRAY['cyberpunk', 'ai', 'hacking'], 'purchased', 'Groundbreaking cyberpunk novel', now() - interval '1 day');

-- User 3 (reader123) - Romance, Mystery, Mixed genres
INSERT INTO user_books (user_id, title, author, genre, city, tags, acquisition_method, notes, created_at) VALUES  
('b2c3d4e5-f6f7-4901-bcde-f23456789012', 'The Notebook', 'Nicholas Sparks', 'Romance', 'Barcelona', ARRAY['contemporary', 'emotional', 'love-story'], 'purchased', 'Heartwarming love story', now() - interval '10 days'),
('b2c3d4e5-f6f7-4901-bcde-f23456789012', 'The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 'Rome', ARRAY['magic', 'storytelling', 'adventure'], 'borrowed', 'Beautiful fantasy with excellent prose', now() - interval '6 days'),
('b2c3d4e5-f6f7-4901-bcde-f23456789012', 'Educated', 'Tara Westover', 'Non-Fiction', 'Prague', ARRAY['memoir', 'education', 'family'], 'gift', 'Powerful memoir about education and family', now() - interval '20 days'),
('b2c3d4e5-f6f7-4901-bcde-f23456789012', 'Me Before You', 'Jojo Moyes', 'Romance', 'Vienna', ARRAY['contemporary', 'emotional', 'disability'], 'purchased', 'Emotional contemporary romance', now() - interval '14 days');