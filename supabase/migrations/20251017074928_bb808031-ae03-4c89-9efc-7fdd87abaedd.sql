-- Fix incorrect Pride and Prejudice book covers
-- Replace wrong cover URLs (The BFG cover ID 14348537) with correct Pride and Prejudice cover
UPDATE user_books 
SET cover_url = 'https://covers.openlibrary.org/b/id/8739162-M.jpg'
WHERE title = 'Pride and Prejudice' 
AND author = 'Jane Austen' 
AND (
  cover_url LIKE '%14348537%' 
  OR cover_url LIKE '%/b/title/Pride%'
  OR cover_url IS NULL
);