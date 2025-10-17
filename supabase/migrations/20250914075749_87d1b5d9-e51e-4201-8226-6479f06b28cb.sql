-- Clean up any existing test data first
DELETE FROM user_books 
WHERE title IN ('Pride and Prejudice', 'The Great Gatsby', 'To Kill a Mockingbird', 'The Catcher in the Rye', 'The Bell Jar', 'Beloved');

-- Insert test book data manually for mapping and journey visualization

-- Scenario A: Pride and Prejudice - Same City (London), Different Neighborhoods
INSERT INTO user_books (
  user_id, title, author, genre, city, neighborhood, 
  latitude, longitude, formatted_address, cover_url,
  notes, created_at
) VALUES
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
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
  ),
  (
    '25bee99a-acb8-41ef-b1e4-f99748a92096', -- bob
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
  ),
  (
    '1001abd5-7386-478a-bf13-1a2a8ce98a2d', -- carol
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
    NOW() - INTERVAL '3 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
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
  ),
  (
    '25bee99a-acb8-41ef-b1e4-f99748a92096', -- bob
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'Fiction',
    'New York',
    'Manhattan',
    40.7829,
    -73.9654,
    'Upper East Side, Manhattan, NY',
    'https://covers.openlibrary.org/b/title/The%20Great%20Gatsby-L.jpg',
    'Found this vintage edition at a Upper East Side antiquarian bookshop. The wealth and luxury here echo Gatsby''s world.',
    NOW() - INTERVAL '8 days'
  ),
  (
    '1001abd5-7386-478a-bf13-1a2a8ce98a2d', -- carol
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'Fiction',
    'New York',
    'Manhattan',
    40.7614,
    -73.9776,
    'Midtown Manhattan, NY',
    'https://covers.openlibrary.org/b/title/The%20Great%20Gatsby-L.jpg',
    'Lunch break reading in Bryant Park. The skyscrapers around me feel like Gatsby''s green light - always reaching for something more.',
    NOW() - INTERVAL '6 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
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
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
    'To Kill a Mockingbird',
    'Harper Lee',
    'Fiction',
    'Oakland',
    'Downtown',
    37.8044,
    -122.2712,
    'Downtown Oakland, CA',
    'https://covers.openlibrary.org/b/title/To%20Kill%20a%20Mockingbird-L.jpg',
    'Continuing this journey across the Bay in Oakland. The diversity here reminds me of the universal nature of Scout''s lessons about humanity.',
    NOW() - INTERVAL '12 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
    'To Kill a Mockingbird',
    'Harper Lee',
    'Fiction',
    'Berkeley',
    'UC Campus',
    37.8719,
    -122.2585,
    'UC Berkeley Campus, Berkeley, CA',
    'https://covers.openlibrary.org/b/title/To%20Kill%20a%20Mockingbird-L.jpg',
    'Finishing this masterpiece on the UC Berkeley campus. Reading about justice and moral courage in this setting of learning feels perfect.',
    NOW() - INTERVAL '9 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
    'The Catcher in the Rye',
    'J.D. Salinger',
    'Fiction',
    'New York',
    'Williamsburg',
    40.7081,
    -73.9571,
    'Williamsburg, Brooklyn, NY',
    'https://covers.openlibrary.org/b/title/The%20Catcher%20in%20the%20Rye-L.jpg',
    'Reading Holden''s story from my favorite coffee shop in Williamsburg. The hipster culture here somehow makes Salinger feel even more relevant.',
    NOW() - INTERVAL '20 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
    'The Bell Jar',
    'Sylvia Plath',
    'Fiction',
    'New York',
    'Williamsburg',
    40.7089,
    -73.9577,
    'Williamsburg, Brooklyn, NY',
    'https://covers.openlibrary.org/b/title/The%20Bell%20Jar-L.jpg',
    'Plath''s raw honesty hits different when you''re reading by the East River. The water and city lights create the perfect moody atmosphere.',
    NOW() - INTERVAL '18 days'
  ),
  (
    '13cef7f1-da08-4357-b6bf-acc2a7b71880', -- alice
    'Beloved',
    'Toni Morrison',
    'Fiction',
    'New York',
    'Williamsburg',
    40.7095,
    -73.9583,
    'Williamsburg, Brooklyn, NY',
    'https://covers.openlibrary.org/b/title/Beloved-L.jpg',
    'Morrison''s powerful prose deserves the quiet corner of McCarren Park where I''m reading this. Each word carries the weight of history.',
    NOW() - INTERVAL '16 days'
  );