-- Add latitude and longitude columns to user_books table
ALTER TABLE user_books 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Add index for better performance on coordinate queries
CREATE INDEX idx_user_books_coordinates ON user_books(latitude, longitude);

-- Update existing books with coordinates for cities we know
UPDATE user_books SET 
  latitude = 22.3193, longitude = 114.1694 
WHERE city = 'Hong Kong';

UPDATE user_books SET 
  latitude = 51.5074, longitude = -0.1278 
WHERE city = 'London';

UPDATE user_books SET 
  latitude = 48.8566, longitude = 2.3522 
WHERE city = 'Paris';

UPDATE user_books SET 
  latitude = 40.7128, longitude = -74.0060 
WHERE city = 'New York';

UPDATE user_books SET 
  latitude = 35.6762, longitude = 139.6503 
WHERE city = 'Tokyo';

UPDATE user_books SET 
  latitude = 34.0522, longitude = -118.2437 
WHERE city = 'Los Angeles';

UPDATE user_books SET 
  latitude = -33.8688, longitude = 151.2093 
WHERE city = 'Sydney';