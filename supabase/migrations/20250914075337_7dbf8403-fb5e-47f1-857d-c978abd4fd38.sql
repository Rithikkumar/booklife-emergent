-- Insert test book data manually for mapping and journey visualization

-- First, get test user IDs (alice, bob, carol)
WITH test_users AS (
  SELECT 
    user_id,
    username
  FROM profiles 
  WHERE username IN ('alice', 'bob', 'carol')
)

-- Scenario A: Pride and Prejudice - Same City (London), Different Neighborhoods
INSERT INTO user_books (
  user_id, title, author, genre, city, neighborhood, 
  latitude, longitude, formatted_address, cover_url,
  notes, created_at
)
SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'Pride and Prejudice',
  'Jane Austen',
  'Romance',
  'London',
  'Kensington',
  51.5000,
  -0.1925,
  'Kensington, London, UK',
  'https://covers.openlibrary.org/b/title/Pride%20and%20Prejudice-L.jpg',
  'Found this beautiful first edition in a charming bookshop on Kensington High Street. The leather binding is exquisite and the pages smell of history.',
  NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'bob'),
  'Pride and Prejudice',
  'Jane Austen',
  'Romance',
  'London',
  'Notting Hill',
  51.5152,
  -0.2056,
  'Notting Hill, London, UK',
  'https://covers.openlibrary.org/b/title/Pride%20and%20Prejudice-L.jpg',
  'Picked up this copy at the famous Portobello Road book market. Love the colorful houses here, perfect setting for Austen.',
  NOW() - INTERVAL '5 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'carol'),
  'Pride and Prejudice',
  'Jane Austen',
  'Romance',
  'London',
  'Greenwich',
  51.4934,
  -0.0098,
  'Greenwich, London, UK',
  'https://covers.openlibrary.org/b/title/Pride%20and%20Prejudice-L.jpg',
  'Reading this by the Thames in Greenwich Park. The maritime history here adds an interesting contrast to Regency England.',
  NOW() - INTERVAL '3 days';

-- Scenario B: The Great Gatsby - Same City (Manhattan), Same Neighborhood
INSERT INTO user_books (
  user_id, title, author, genre, city, neighborhood,
  latitude, longitude, formatted_address, cover_url,
  notes, created_at
)
SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'The Great Gatsby',
  'F. Scott Fitzgerald',
  'Fiction',
  'New York',
  'Manhattan',
  40.7505,
  -73.9934,
  'Times Square, Manhattan, NY',
  'https://covers.openlibrary.org/b/title/The%20Great%20Gatsby-L.jpg',
  'Reading Gatsby in the heart of NYC feels so appropriate. The bright lights and energy mirror the Jazz Age perfectly.',
  NOW() - INTERVAL '10 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'bob'),
  'The Great Gatsby',
  'F. Scott Fitzgerald',
  'Fiction',
  'New York',
  'Manhattan',
  40.7829,
  -73.9654,
  'Upper East Side, Manhattan, NY',
  'https://covers.openlibrary.org/b/title/The%20Great%20Gatsby-L.jpg',
  'Found this vintage edition at a Upper East Side antiquarian bookshop. The wealth and luxury here echo Gatsby\'s world.',
  NOW() - INTERVAL '8 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'carol'),
  'The Great Gatsby',
  'F. Scott Fitzgerald',
  'Fiction',
  'New York',
  'Manhattan',
  40.7614,
  -73.9776,
  'Midtown Manhattan, NY',
  'https://covers.openlibrary.org/b/title/The%20Great%20Gatsby-L.jpg',
  'Lunch break reading in Bryant Park. The skyscrapers around me feel like Gatsby\'s green light - always reaching for something more.',
  NOW() - INTERVAL '6 days';

-- Scenario C: To Kill a Mockingbird - Single User (Alice) across San Francisco neighborhoods
INSERT INTO user_books (
  user_id, title, author, genre, city, neighborhood,
  latitude, longitude, formatted_address, cover_url,
  notes, created_at
)
SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'To Kill a Mockingbird',
  'Harper Lee',
  'Fiction',
  'San Francisco',
  'Mission District',
  37.7599,
  -122.4148,
  'Mission District, San Francisco, CA',
  'https://covers.openlibrary.org/b/title/To%20Kill%20a%20Mockingbird-L.jpg',
  'Started this powerful book in the Mission. The murals here remind me that art has always been a form of social justice.',
  NOW() - INTERVAL '15 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'To Kill a Mockingbird',
  'Harper Lee',
  'Fiction',
  'San Francisco',
  'Castro',
  37.7609,
  -122.4350,
  'Castro District, San Francisco, CA',
  'https://covers.openlibrary.org/b/title/To%20Kill%20a%20Mockingbird-L.jpg',
  'Continuing this journey through the Castro. This neighborhood\'s history of fighting for rights resonates deeply with Scout\'s story.',
  NOW() - INTERVAL '12 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'To Kill a Mockingbird',
  'Harper Lee',
  'Fiction',
  'San Francisco',
  'Chinatown',
  37.7941,
  -122.4078,
  'Chinatown, San Francisco, CA',
  'https://covers.openlibrary.org/b/title/To%20Kill%20a%20Mockingbird-L.jpg',
  'Finishing this masterpiece in Chinatown. Reading about prejudice while surrounded by this vibrant, resilient community adds layers to Lee\'s message.',
  NOW() - INTERVAL '9 days';

-- Scenario D: Multiple Books - Single User (Alice) in Williamsburg, Brooklyn
INSERT INTO user_books (
  user_id, title, author, genre, city, neighborhood,
  latitude, longitude, formatted_address, cover_url,
  notes, created_at
)
SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'The Catcher in the Rye',
  'J.D. Salinger',
  'Fiction',
  'New York',
  'Williamsburg',
  40.7081,
  -73.9571,
  'Williamsburg, Brooklyn, NY',
  'https://covers.openlibrary.org/b/title/The%20Catcher%20in%20the%20Rye-L.jpg',
  'Reading Holden\'s story from my favorite coffee shop in Williamsburg. The hipster culture here somehow makes Salinger feel even more relevant.',
  NOW() - INTERVAL '20 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'The Bell Jar',
  'Sylvia Plath',
  'Fiction',
  'New York',
  'Williamsburg',
  40.7089,
  -73.9577,
  'Williamsburg, Brooklyn, NY',
  'https://covers.openlibrary.org/b/title/The%20Bell%20Jar-L.jpg',
  'Plath\'s raw honesty hits different when you\'re reading by the East River. The water and city lights create the perfect moody atmosphere.',
  NOW() - INTERVAL '18 days'

UNION ALL

SELECT 
  (SELECT user_id FROM test_users WHERE username = 'alice'),
  'Beloved',
  'Toni Morrison',
  'Fiction',
  'New York',
  'Williamsburg',
  40.7095,
  -73.9583,
  'Williamsburg, Brooklyn, NY',
  'https://covers.openlibrary.org/b/title/Beloved-L.jpg',
  'Morrison\'s powerful prose deserves the quiet corner of McCarren Park where I\'m reading this. Each word carries the weight of history.',
  NOW() - INTERVAL '16 days';