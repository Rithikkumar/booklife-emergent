-- Create additional neighborhood-based test data for book journeys
-- Using different books to avoid conflicts

-- Los Angeles - Beverly Hills & Culver City  
-- "Catch-22" by Joseph Heller (2 in Beverly Hills, 1 in Culver City)
INSERT INTO user_books (
  user_id, title, author, genre, tags, city, neighborhood, 
  formatted_address, latitude, longitude, notes, created_at
) VALUES
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'Catch-22', 'Joseph Heller', 'Satire', 
   ARRAY['war', 'black-comedy', 'satire'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'The absurdity of war meets the absurdity of wealth. Heller would appreciate the irony.',
   NOW() - INTERVAL '15 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'Catch-22', 'Joseph Heller', 'Satire', 
   ARRAY['war', 'black-comedy', 'satire'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'Reading this anti-war masterpiece while surrounded by luxury feels perfectly Catch-22.',
   NOW() - INTERVAL '8 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'carol' LIMIT 1), 
   'Catch-22', 'Joseph Heller', 'Satire', 
   ARRAY['war', 'black-comedy', 'satire'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   NULL, NOW() - INTERVAL '3 days'),

-- "One Hundred Years of Solitude" by Gabriel García Márquez (1 in Beverly Hills, 2 in Culver City)
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'One Hundred Years of Solitude', 'Gabriel García Márquez', 'Magical Realism', 
   ARRAY['magical-realism', 'latin-american', 'family-saga'], 'Los Angeles', 'Beverly Hills',
   'Beverly Hills, Los Angeles, CA, USA', 34.0736, -118.4004,
   'The cyclical nature of history feels especially poignant in this land of endless reinvention.',
   NOW() - INTERVAL '22 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'One Hundred Years of Solitude', 'Gabriel García Márquez', 'Magical Realism', 
   ARRAY['magical-realism', 'latin-american', 'family-saga'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   'Márquez''s magical realism feels at home in LA''s creative atmosphere.',
   NOW() - INTERVAL '12 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'carol' LIMIT 1), 
   'One Hundred Years of Solitude', 'Gabriel García Márquez', 'Magical Realism', 
   ARRAY['magical-realism', 'latin-american', 'family-saga'], 'Los Angeles', 'Culver City',
   'Culver City, Los Angeles, CA, USA', 34.0211, -118.3965,
   NULL, NOW() - INTERVAL '5 days'),

-- Seattle - Capitol Hill, Ballard, Fremont
-- "The Road" by Cormac McCarthy
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'The Road', 'Cormac McCarthy', 'Post-Apocalyptic Fiction', 
   ARRAY['post-apocalyptic', 'father-son', 'survival'], 'Seattle', 'Capitol Hill',
   'Capitol Hill, Seattle, WA, USA', 47.6205, -122.3212,
   'Reading about desolation while surrounded by Seattle''s vibrant culture creates interesting contrast.',
   NOW() - INTERVAL '18 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'The Road', 'Cormac McCarthy', 'Post-Apocalyptic Fiction', 
   ARRAY['post-apocalyptic', 'father-son', 'survival'], 'Seattle', 'Ballard',
   'Ballard, Seattle, WA, USA', 47.6777, -122.3845,
   'The misty Seattle weather adds to the book''s bleak atmosphere.',
   NOW() - INTERVAL '9 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'carol' LIMIT 1), 
   'The Road', 'Cormac McCarthy', 'Post-Apocalyptic Fiction', 
   ARRAY['post-apocalyptic', 'father-son', 'survival'], 'Seattle', 'Fremont',
   'Fremont, Seattle, WA, USA', 47.6512, -122.3505,
   NULL, NOW() - INTERVAL '2 days'),

-- Boston - Back Bay, North End, Cambridge
-- "The Handmaid''s Tale" by Margaret Atwood
  ((SELECT user_id FROM profiles WHERE username = 'carol' LIMIT 1), 
   'The Handmaid''s Tale', 'Margaret Atwood', 'Dystopian Fiction', 
   ARRAY['dystopia', 'feminism', 'totalitarianism'], 'Boston', 'Back Bay',
   'Back Bay, Boston, MA, USA', 42.3505, -71.0743,
   'Reading Atwood''s warnings about theocracy in the cradle of American freedom.',
   NOW() - INTERVAL '25 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'The Handmaid''s Tale', 'Margaret Atwood', 'Dystopian Fiction', 
   ARRAY['dystopia', 'feminism', 'totalitarianism'], 'Boston', 'North End',
   'North End, Boston, MA, USA', 42.3647, -71.0542,
   'The historic cobblestones of North End make Gilead feel uncomfortably possible.',
   NOW() - INTERVAL '16 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'The Handmaid''s Tale', 'Margaret Atwood', 'Dystopian Fiction', 
   ARRAY['dystopia', 'feminism', 'totalitarianism'], 'Boston', 'Cambridge',
   'Cambridge, Boston, MA, USA', 42.3736, -71.1097,
   NULL, NOW() - INTERVAL '7 days'),

-- Portland - Pearl District, Hawthorne, Alberta
-- "Where the Crawdads Sing" by Delia Owens
  ((SELECT user_id FROM profiles WHERE username = 'bob' LIMIT 1), 
   'Where the Crawdads Sing', 'Delia Owens', 'Mystery', 
   ARRAY['mystery', 'nature', 'coming-of-age'], 'Portland', 'Pearl District',
   'Pearl District, Portland, OR, USA', 45.5272, -122.6819,
   'Urban Portland provides interesting counterpoint to Kya''s wild marsh setting.',
   NOW() - INTERVAL '20 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'carol' LIMIT 1), 
   'Where the Crawdads Sing', 'Delia Owens', 'Mystery', 
   ARRAY['mystery', 'nature', 'coming-of-age'], 'Portland', 'Hawthorne',
   'Hawthorne District, Portland, OR, USA', 45.5098, -122.6606,
   'The quirky Hawthorne vibe somehow complements this nature mystery perfectly.',
   NOW() - INTERVAL '11 days'),
  
  ((SELECT user_id FROM profiles WHERE username = 'alice' LIMIT 1), 
   'Where the Crawdads Sing', 'Delia Owens', 'Mystery', 
   ARRAY['mystery', 'nature', 'coming-of-age'], 'Portland', 'Alberta',
   'Alberta District, Portland, OR, USA', 45.5598, -122.6554,
   NULL, NOW() - INTERVAL '4 days');