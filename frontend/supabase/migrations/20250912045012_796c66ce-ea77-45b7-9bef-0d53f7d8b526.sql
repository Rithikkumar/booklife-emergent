-- Create function to get book statistics
CREATE OR REPLACE FUNCTION public.get_book_statistics()
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  genre text,
  tags text[],
  city text,
  cover_url text,
  user_id uuid,
  created_at timestamptz,
  journeys bigint,
  stories bigint,
  current_location text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH book_stats AS (
    SELECT 
      ub.title,
      ub.author,
      COUNT(*) as journeys,
      COUNT(CASE WHEN ub.notes IS NOT NULL AND ub.notes != '' THEN 1 END) as stories,
      -- Get the most recent location for this book
      (SELECT city FROM user_books ub2 
       WHERE ub2.title = ub.title AND ub2.author = ub.author AND ub2.city IS NOT NULL 
       ORDER BY ub2.created_at DESC LIMIT 1) as current_location
    FROM user_books ub
    GROUP BY ub.title, ub.author
  )
  SELECT DISTINCT ON (ub.title, ub.author)
    ub.id,
    ub.title,
    ub.author,
    ub.genre,
    ub.tags,
    ub.city,
    ub.cover_url,
    ub.user_id,
    ub.created_at,
    bs.journeys,
    bs.stories,
    COALESCE(bs.current_location, ub.city, 'Unknown') as current_location
  FROM user_books ub
  JOIN book_stats bs ON ub.title = bs.title AND ub.author = bs.author
  ORDER BY ub.title, ub.author, ub.created_at DESC;
$$;