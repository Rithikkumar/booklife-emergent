-- Insert test users for the journey
INSERT INTO profiles (user_id, username, display_name) VALUES 
(gen_random_uuid(), 'traveler_alice', 'Alice Thompson'),
(gen_random_uuid(), 'bookworm_bob', 'Bob Martinez'),
(gen_random_uuid(), 'reader_claire', 'Claire Chen'),
(gen_random_uuid(), 'nomad_david', 'David Johnson'),
(gen_random_uuid(), 'explorer_emma', 'Emma Rodriguez');

-- Insert "The Alchemist" book with 5 different journey points
-- Journey 1: Started in New York
INSERT INTO user_books (
  user_id, 
  title, 
  author, 
  genre, 
  city, 
  notes, 
  tags,
  created_at
) VALUES (
  (SELECT user_id FROM profiles WHERE username = 'traveler_alice'),
  'The Alchemist',
  'Paulo Coelho',
  'fiction',
  'New York',
  'Found this gem in a small bookstore in Manhattan. The story about following your dreams really resonated with me during my time in the city that never sleeps.',
  ARRAY['inspiration', 'philosophy', 'adventure'],
  '2023-01-15 10:00:00+00'
);

-- Journey 2: Traveled to Paris
INSERT INTO user_books (
  user_id, 
  title, 
  author, 
  genre, 
  city, 
  notes, 
  tags,
  created_at
) VALUES (
  (SELECT user_id FROM profiles WHERE username = 'bookworm_bob'),
  'The Alchemist',
  'Paulo Coelho',
  'fiction',
  'Paris',
  'Alice gave me this book when I moved to Paris for my studies. Reading it by the Seine at sunset was magical - the perfect setting for a story about personal legends.',
  ARRAY['inspiration', 'philosophy', 'travel'],
  '2023-04-22 14:30:00+00'
);

-- Journey 3: Continued to Tokyo
INSERT INTO user_books (
  user_id, 
  title, 
  author, 
  genre, 
  city, 
  notes, 
  tags,
  created_at
) VALUES (
  (SELECT user_id FROM profiles WHERE username = 'reader_claire'),
  'The Alchemist',
  'Paulo Coelho',
  'fiction',
  'Tokyo',
  'Bob passed this to me during my exchange program in Tokyo. The message about listening to your heart spoke to me while navigating life in this incredible city.',
  ARRAY['inspiration', 'philosophy', 'dreams'],
  '2023-07-08 09:15:00+00'
);

-- Journey 4: Made it to Sydney
INSERT INTO user_books (
  user_id, 
  title, 
  author, 
  genre, 
  city, 
  notes, 
  tags,
  created_at
) VALUES (
  (SELECT user_id FROM profiles WHERE username = 'nomad_david'),
  'The Alchemist',
  'Paulo Coelho',
  'fiction',
  'Sydney',
  'Claire shipped this to me in Sydney where I was working remotely. Perfect timing - I was at a crossroads in my career and this book reminded me to pursue my true calling.',
  ARRAY['inspiration', 'philosophy', 'career'],
  '2023-09-30 16:45:00+00'
);

-- Journey 5: Final stop in Rio de Janeiro
INSERT INTO user_books (
  user_id, 
  title, 
  author, 
  genre, 
  city, 
  notes, 
  tags,
  created_at
) VALUES (
  (SELECT user_id FROM profiles WHERE username = 'explorer_emma'),
  'The Alchemist',
  'Paulo Coelho',
  'fiction',
  'Rio de Janeiro',
  'David brought this book when he visited me in Rio. How fitting that it ended up in Brazil, the author''s home country! I read it on Copacabana beach, completing this amazing journey.',
  ARRAY['inspiration', 'philosophy', 'homecoming'],
  '2023-12-12 18:20:00+00'
);