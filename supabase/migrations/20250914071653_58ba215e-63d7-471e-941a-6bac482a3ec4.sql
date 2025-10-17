-- Clear existing user_books data and create proper test scenarios that respect constraints

-- First delete any existing book data
DELETE FROM user_books;

-- Insert realistic test book data that respects unique constraints
DO $$
DECLARE
    alice_id UUID;
    bob_id UUID; 
    carol_id UUID;
BEGIN
    -- Get the user IDs
    SELECT user_id INTO alice_id FROM profiles WHERE username = 'alice';
    SELECT user_id INTO bob_id FROM profiles WHERE username = 'bob'; 
    SELECT user_id INTO carol_id FROM profiles WHERE username = 'carol';
    
    -- Only proceed if all users exist
    IF alice_id IS NOT NULL AND bob_id IS NOT NULL AND carol_id IS NOT NULL THEN
        
        -- Scenario 1: Global Journey - "The Alchemist" by Paulo Coelho
        -- Alice (NYC) -> Bob (Paris) -> Carol (Tokyo)
        INSERT INTO user_books (user_id, title, author, genre, city, latitude, longitude, notes, created_at, cover_url) VALUES
        (alice_id, 'The Alchemist', 'Paulo Coelho', 'Fiction', 'New York', 40.7128, -74.0060, 'Started my journey with this inspiring book in the Big Apple!', '2024-01-15T10:00:00Z', 'https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg'),
        (bob_id, 'The Alchemist', 'Paulo Coelho', 'Fiction', 'Paris', 48.8566, 2.3522, 'Reading this masterpiece by the Seine. Magnifique!', '2024-02-20T14:30:00Z', 'https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg'),
        (carol_id, 'The Alchemist', 'Paulo Coelho', 'Fiction', 'Tokyo', 35.6762, 139.6503, 'この本は東京で私の心に触れました。Beautiful story!', '2024-04-10T09:15:00Z', 'https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg');

        -- Scenario 2: Cross-USA Journey - "Harry Potter" by J.K. Rowling  
        -- Alice (NYC) -> Bob (Chicago) -> Carol (LA) - different cities to avoid constraint
        INSERT INTO user_books (user_id, title, author, genre, city, neighborhood, latitude, longitude, notes, created_at, cover_url) VALUES
        (alice_id, 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'New York', 'Manhattan', 40.7831, -73.9712, 'Reading about magic in the magical city! Started in Manhattan.', '2024-03-01T11:00:00Z', 'https://covers.openlibrary.org/b/isbn/9780439708180-M.jpg'),
        (bob_id, 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'Chicago', 'Downtown', 41.8781, -87.6298, 'Continued the magical journey in the Windy City!', '2024-03-15T16:20:00Z', 'https://covers.openlibrary.org/b/isbn/9780439708180-M.jpg'),
        (carol_id, 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'Los Angeles', 'Hollywood', 34.0522, -118.2437, 'Finished the magical story in the City of Angels!', '2024-04-01T13:45:00Z', 'https://covers.openlibrary.org/b/isbn/9780439708180-M.jpg');

        -- Scenario 3: European Clustering - "1984" by George Orwell
        -- All users in London area, different neighborhoods
        INSERT INTO user_books (user_id, title, author, genre, city, neighborhood, latitude, longitude, notes, created_at, cover_url) VALUES
        (alice_id, '1984', 'George Orwell', 'Dystopian Fiction', 'London', 'Westminster', 51.4975, -0.1357, 'Reading Orwell in the heart of political London - so fitting!', '2024-05-01T10:30:00Z', 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg'),
        (bob_id, '1984', 'George Orwell', 'Dystopian Fiction', 'Manchester', 'City Centre', 53.4808, -2.2426, 'Big Brother is watching from Manchester! Chilling read.', '2024-05-15T14:00:00Z', 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg'),
        (carol_id, '1984', 'George Orwell', 'Dystopian Fiction', 'Edinburgh', 'Old Town', 55.9533, -3.1883, 'Finished this masterpiece in beautiful Edinburgh. Thought-provoking!', '2024-06-01T18:25:00Z', 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg');

        -- Scenario 4: Mixed with Desert Coordinates - "Dune" by Frank Herbert
        -- Real + Desert locations with proper coordinates (all 3 previous journeys)
        INSERT INTO user_books (user_id, title, author, genre, city, latitude, longitude, notes, created_at, cover_url) VALUES
        (alice_id, 'Dune', 'Frank Herbert', 'Science Fiction', 'San Francisco', 37.7749, -122.4194, 'Started this epic sci-fi saga by the Golden Gate!', '2024-08-04T16:35:24Z', 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg'),
        (bob_id, 'Dune', 'Frank Herbert', 'Science Fiction', 'Sahara Desert', 23.4162, 25.6628, 'Reading about Arrakis while actually in the desert - incredibly immersive!', '2024-09-01T12:00:00Z', 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg'),
        (carol_id, 'Dune', 'Frank Herbert', 'Science Fiction', 'Berlin', 52.5200, 13.4050, 'The saga continues in Berlin - what an epic conclusion!', '2024-09-11T16:35:24Z', 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg');

        RAISE NOTICE 'Successfully created 12 realistic test book journeys across 4 scenarios';
    ELSE
        RAISE EXCEPTION 'Test users not found. Please ensure alice, bob, and carol profiles exist.';
    END IF;
END $$;