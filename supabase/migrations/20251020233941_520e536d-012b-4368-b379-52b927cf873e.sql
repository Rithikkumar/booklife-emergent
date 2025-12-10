
-- Insert test book data for "1984" by George Orwell with multiple journeys
-- This will be owned by a different user so the test user can register as new owner

INSERT INTO user_books (
  user_id,
  title,
  author,
  code,
  genre,
  tags,
  city,
  neighborhood,
  formatted_address,
  notes,
  acquisition_method,
  created_at
) VALUES 
-- First journey (owned by user_e692a88b)
(
  'e692a88b-4ce7-4ef5-b588-9b7e3b5dd489',
  '1984',
  'George Orwell',
  'ORWELL84',
  'Fiction',
  ARRAY['dystopian', 'classic', 'political'],
  'London',
  'Westminster',
  'Westminster, London, UK',
  'Started reading this dystopian masterpiece in the heart of political London. Big Brother is watching!',
  'bookstore',
  '2024-03-15 10:00:00+00'
),
-- Second journey (different user, same book code)
(
  'e692a88b-4ce7-4ef5-b588-9b7e3b5dd489',
  '1984',
  'George Orwell',
  'ORWELL84',
  'Fiction',
  ARRAY['dystopian', 'classic', 'political'],
  'Manchester',
  'City Centre',
  'City Centre, Manchester, UK',
  'Passed this book to a friend in Manchester. The themes feel even more relevant today.',
  'friend',
  '2024-04-20 14:30:00+00'
),
-- Third journey (different user, same book code)
(
  'e692a88b-4ce7-4ef5-b588-9b7e3b5dd489',
  '1984',
  'George Orwell',
  'ORWELL84',
  'Fiction',
  ARRAY['dystopian', 'classic', 'political'],
  'Edinburgh',
  'Old Town',
  'Old Town, Edinburgh, Scotland',
  'This book traveled to Edinburgh! Reading it in the historic Old Town was surreal. Absolutely chilling and thought-provoking.',
  'friend',
  '2024-06-10 16:45:00+00'
);
