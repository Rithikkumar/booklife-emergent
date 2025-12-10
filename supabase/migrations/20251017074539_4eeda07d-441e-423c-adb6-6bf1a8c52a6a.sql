-- Fix the ambiguous column reference in get_book_statistics_v2
DROP FUNCTION IF EXISTS public.get_book_statistics_v2();

CREATE OR REPLACE FUNCTION public.get_book_statistics_v2()
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  genre text,
  tags text[],
  city text,
  cover_url text,
  user_id uuid,
  created_at timestamp with time zone,
  journeys bigint,
  stories bigint,
  current_location text,
  code text
) 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH book_stats AS (
    -- For books WITH codes: group by code (each code = unique physical book)
    SELECT 
      ub.code,
      ub.title,
      ub.author,
      COUNT(*) as journeys,
      COUNT(CASE WHEN ub.notes IS NOT NULL AND ub.notes != '' THEN 1 END) as stories,
      MAX(ub.created_at) as latest_activity
    FROM user_books ub
    WHERE ub.code IS NOT NULL
    GROUP BY ub.code, ub.title, ub.author
    
    UNION ALL
    
    -- For books WITHOUT codes: group by title + author
    SELECT 
      NULL as code,
      ub.title,
      ub.author,
      COUNT(*) as journeys,
      COUNT(CASE WHEN ub.notes IS NOT NULL AND ub.notes != '' THEN 1 END) as stories,
      MAX(ub.created_at) as latest_activity
    FROM user_books ub
    WHERE ub.code IS NULL
    GROUP BY ub.title, ub.author
  )
  SELECT DISTINCT ON (COALESCE(bs.code, bs.title || bs.author))
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
    COALESCE(
      (SELECT ub2.city FROM user_books ub2 
       WHERE COALESCE(ub2.code, '') = COALESCE(bs.code, '') 
       AND ub2.title = bs.title 
       AND ub2.author = bs.author 
       AND ub2.city IS NOT NULL 
       ORDER BY ub2.created_at DESC LIMIT 1),
      ub.city,
      'Unknown'
    ) as current_location,
    bs.code
  FROM user_books ub
  JOIN book_stats bs ON 
    COALESCE(ub.code, '') = COALESCE(bs.code, '') 
    AND ub.title = bs.title 
    AND ub.author = bs.author
  ORDER BY COALESCE(bs.code, bs.title || bs.author), bs.latest_activity DESC;
END;
$$ LANGUAGE plpgsql;