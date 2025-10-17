-- Create additional neighborhood-based test data for book journeys
-- Focus on same city, different neighborhoods to test location granularity

-- Los Angeles - Beverly Hills & Culver City
-- "The Catcher in the Rye" by J.D. Salinger
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  -- Two journeys in Beverly Hills
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'The Catcher in the Rye', 'J.D. Salinger', 'Classic Literature', 
   ARRAY['coming-of-age', 'american-literature'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'Found this classic at a bookstore on Rodeo Drive. Holden''s voice really resonates with the urban alienation theme.',
   NOW() - INTERVAL '15 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'The Catcher in the Rye', 'J.D. Salinger', 'Classic Literature', 
   ARRAY['coming-of-age', 'american-literature'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'Borrowed from Alice. The Beverly Hills setting made me think about privilege and authenticity in new ways.',
   NOW() - INTERVAL '8 days'),
  
  -- One journey in Culver City
  ((SELECT user_id FROM profiles WHERE username = 'charlie' LIMIT 1), 
   'The Catcher in the Rye', 'J.D. Salinger', 'Classic Literature', 
   ARRAY['coming-of-age', 'american-literature'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   NULL, NOW() - INTERVAL '3 days'),

-- "Beloved" by Toni Morrison
-- One in Beverly Hills, two in Culver City
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'diana' LIMIT 1), 
   'Beloved', 'Toni Morrison', 'Historical Fiction', 
   ARRAY['african-american-literature', 'slavery', 'historical'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'This powerful novel about memory and trauma feels especially poignant when read in such an affluent setting.',
   NOW() - INTERVAL '22 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'Beloved', 'Toni Morrison', 'Historical Fiction', 
   ARRAY['african-american-literature', 'slavery', 'historical'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   'Discussing this masterpiece with my book club here. Morrison''s prose is absolutely haunting.',
   NOW() - INTERVAL '12 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'Beloved', 'Toni Morrison', 'Historical Fiction', 
   ARRAY['african-american-literature', 'slavery', 'historical'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   NULL, NOW() - INTERVAL '5 days'),

-- "The Bell Jar" by Sylvia Plath
-- Mixed Beverly Hills and Culver City
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'charlie' LIMIT 1), 
   'The Bell Jar', 'Sylvia Plath', 'Literary Fiction', 
   ARRAY['mental-health', 'autobiography', 'feminist'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'Plath''s raw honesty about depression hit differently while surrounded by all this glamour.',
   NOW() - INTERVAL '18 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'diana' LIMIT 1), 
   'The Bell Jar', 'Sylvia Plath', 'Literary Fiction', 
   ARRAY['mental-health', 'autobiography', 'feminist'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   NULL, NOW() - INTERVAL '9 days'),

-- San Francisco - Mission District, Castro, SOMA
-- "Dune" by Frank Herbert
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'Dune', 'Frank Herbert', 'Science Fiction', 
   ARRAY['epic', 'space-opera', 'politics'], 'San Francisco', 'Mission District',
   'Mission District, San Francisco, CA, USA', 37.7599, -122.4148,
   'Reading about desert planets while enjoying Mission burritos. The spice must flow!',
   NOW() - INTERVAL '25 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'Dune', 'Frank Herbert', 'Science Fiction', 
   ARRAY['epic', 'space-opera', 'politics'], 'San Francisco', 'Castro',
   'Castro District, San Francisco, CA, USA', 37.7609, -122.4350,
   'The themes of rebellion and identity really resonate in this historic neighborhood.',
   NOW() - INTERVAL '16 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'charlie' LIMIT 1), 
   'Dune', 'Frank Herbert', 'Science Fiction', 
   ARRAY['epic', 'space-opera', 'politics'], 'San Francisco', 'SOMA',
   'SOMA, San Francisco, CA, USA', 37.7749, -122.4194,
   NULL, NOW() - INTERVAL '7 days'),

-- Chicago - Lincoln Park, Wicker Park, The Loop
-- "Harry Potter and the Philosopher's Stone" by J.K. Rowling
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'diana' LIMIT 1), 
   'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 
   ARRAY['magic', 'children', 'adventure'], 'Chicago', 'Lincoln Park',
   'Lincoln Park, Chicago, IL, USA', 41.9243, -87.6367,
   'Re-reading this classic while walking through Lincoln Park Zoo. Magic feels real here!',
   NOW() - INTERVAL '20 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 
   ARRAY['magic', 'children', 'adventure'], 'Chicago', 'Wicker Park',
   'Wicker Park, Chicago, IL, USA', 41.9073, -87.6776,
   'The hipster vibe of Wicker Park adds an interesting contrast to Hogwarts'' old-world charm.',
   NOW() - INTERVAL '11 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 
   ARRAY['magic', 'children', 'adventure'], 'Chicago', 'The Loop',
   'The Loop, Chicago, IL, USA', 41.8781, -87.6298,
   NULL, NOW() - INTERVAL '4 days'),

-- London - Camden, Shoreditch, Covent Garden
-- "1984" by George Orwell
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'charlie' LIMIT 1), 
   '1984', 'George Orwell', 'Dystopian Fiction', 
   ARRAY['dystopia', 'surveillance', 'political'], 'London', 'Camden',
   'Camden, London, UK', 51.5392, -0.1426,
   'Reading Orwell in Camden feels perfectly fitting - the punk spirit meets Big Brother warnings.',
   NOW() - INTERVAL '28 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'diana' LIMIT 1), 
   '1984', 'George Orwell', 'Dystopian Fiction', 
   ARRAY['dystopia', 'surveillance', 'political'], 'London', 'Shoreditch',
   'Shoreditch, London, UK', 51.5255, -0.0786,
   'The tech startup atmosphere of Shoreditch makes the surveillance themes feel uncomfortably relevant.',
   NOW() - INTERVAL '14 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   '1984', 'George Orwell', 'Dystopian Fiction', 
   ARRAY['dystopia', 'surveillance', 'political'], 'London', 'Covent Garden',
   'Covent Garden, London, UK', 51.5118, -0.1226,
   NULL, NOW() - INTERVAL '6 days'),

-- Miami - South Beach, Little Havana, Wynwood
-- "The Alchemist" by Paulo Coelho
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', 
   ARRAY['self-discovery', 'philosophy', 'journey'], 'Miami', 'South Beach',
   'South Beach, Miami, FL, USA', 25.7907, -80.1300,
   'Reading about following your dreams while watching the sunrise over South Beach. Pure magic.',
   NOW() - INTERVAL '19 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'charlie' LIMIT 1), 
   'The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', 
   ARRAY['self-discovery', 'philosophy', 'journey'], 'Miami', 'Little Havana',
   'Little Havana, Miami, FL, USA', 25.7667, -80.2201,
   'The themes of cultural journey resonate deeply in this vibrant Cuban neighborhood.',
   NOW() - INTERVAL '10 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'diana' LIMIT 1), 
   'The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', 
   ARRAY['self-discovery', 'philosophy', 'journey'], 'Miami', 'Wynwood',
   'Wynwood, Miami, FL, USA', 25.8010, -80.1998,
   NULL, NOW() - INTERVAL '2 days');