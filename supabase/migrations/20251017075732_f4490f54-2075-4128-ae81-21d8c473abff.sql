-- Update cover URL for all Pride and Prejudice books by Jane Austen
UPDATE user_books 
SET cover_url = 'https://covers.openlibrary.org/b/id/7893680-M.jpg'
WHERE LOWER(title) = 'pride and prejudice' 
AND LOWER(author) = 'jane austen';