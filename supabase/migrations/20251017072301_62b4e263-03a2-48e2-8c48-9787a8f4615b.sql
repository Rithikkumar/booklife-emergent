-- Drop the old check constraint
ALTER TABLE user_books DROP CONSTRAINT IF EXISTS user_books_acquisition_method_check;

-- Add new check constraint with all acquisition methods
ALTER TABLE user_books ADD CONSTRAINT user_books_acquisition_method_check 
CHECK (acquisition_method IN (
  'bookstore',
  'online-store',
  'thrift-store',
  'library-sale',
  'yard-sale',
  'flea-market',
  'book-fair',
  'friend',
  'family',
  'gift',
  'book-swap',
  'inherited',
  'school',
  'found',
  'subscription',
  'online',
  'received'
));