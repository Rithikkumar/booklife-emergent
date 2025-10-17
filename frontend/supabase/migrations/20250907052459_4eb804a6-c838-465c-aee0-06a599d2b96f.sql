-- Add genre/category fields to user_books table for better filtering
ALTER TABLE user_books 
ADD COLUMN genre text,
ADD COLUMN tags text[] DEFAULT '{}';

-- Add indexes for better performance on filtering
CREATE INDEX idx_user_books_genre ON user_books(genre);
CREATE INDEX idx_user_books_tags ON user_books USING GIN(tags);

-- Update existing books with sample genres based on common book patterns
UPDATE user_books 
SET genre = CASE 
  WHEN LOWER(title) LIKE '%habit%' OR LOWER(title) LIKE '%atomic%' THEN 'non-fiction'
  WHEN LOWER(title) LIKE '%midnight%' OR LOWER(title) LIKE '%library%' THEN 'fiction'
  WHEN LOWER(title) LIKE '%seven%' OR LOWER(title) LIKE '%moon%' THEN 'literary-fiction'
  WHEN LOWER(title) LIKE '%pride%' OR LOWER(title) LIKE '%prejudice%' THEN 'romance'
  WHEN LOWER(title) LIKE '%dune%' THEN 'science-fiction'
  WHEN LOWER(title) LIKE '%mystery%' OR LOWER(title) LIKE '%detective%' THEN 'mystery'
  ELSE 'fiction'
END
WHERE genre IS NULL;

-- Add some sample tags
UPDATE user_books 
SET tags = CASE 
  WHEN genre = 'non-fiction' THEN ARRAY['self-help', 'productivity']
  WHEN genre = 'fiction' THEN ARRAY['contemporary', 'popular']
  WHEN genre = 'literary-fiction' THEN ARRAY['award-winning', 'literary']
  WHEN genre = 'romance' THEN ARRAY['classic', 'romantic']
  WHEN genre = 'science-fiction' THEN ARRAY['sci-fi', 'epic']
  WHEN genre = 'mystery' THEN ARRAY['suspense', 'thriller']
  ELSE ARRAY['general']
END
WHERE tags = '{}' OR tags IS NULL;