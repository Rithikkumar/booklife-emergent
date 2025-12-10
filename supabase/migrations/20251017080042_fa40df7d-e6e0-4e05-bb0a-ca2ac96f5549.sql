-- Clear all stored cover URLs to force dynamic fetching
UPDATE user_books 
SET cover_url = NULL;

-- Add comment for future reference
COMMENT ON COLUMN user_books.cover_url IS 'Deprecated: Cover URLs should be fetched dynamically using title and author, not stored in database';