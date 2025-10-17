-- Create function to get user interests based on their activity
CREATE OR REPLACE FUNCTION public.get_user_interests(p_user_id uuid)
RETURNS TABLE(
    interest_type text,
    interest_value text,
    weight numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH user_book_interests AS (
        -- Extract interests from user's books
        SELECT 
            'genre' as interest_type,
            genre as interest_value,
            COUNT(*) * 2.0 as weight -- Books carry more weight
        FROM user_books 
        WHERE user_id = p_user_id AND genre IS NOT NULL
        GROUP BY genre
        
        UNION ALL
        
        -- Extract tag interests from user's books
        SELECT 
            'tag' as interest_type,
            UNNEST(tags) as interest_value,
            COUNT(*) * 1.5 as weight
        FROM user_books 
        WHERE user_id = p_user_id AND tags IS NOT NULL
        GROUP BY UNNEST(tags)
    ),
    community_interests AS (
        -- Extract interests from communities user has joined
        SELECT 
            'tag' as interest_type,
            UNNEST(c.tags) as interest_value,
            COUNT(*) * 1.0 as weight
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        WHERE cm.user_id = p_user_id AND c.tags IS NOT NULL
        GROUP BY UNNEST(c.tags)
    ),
    class_interests AS (
        -- Extract interests from classes user has participated in
        SELECT 
            'category' as interest_type,
            bc.category as interest_value,
            COUNT(*) * 3.0 as weight -- Class participation shows strong interest
        FROM class_participants cp
        JOIN book_classes bc ON bc.id = cp.class_id
        WHERE cp.user_id = p_user_id AND bc.category IS NOT NULL
        GROUP BY bc.category
        
        UNION ALL
        
        SELECT 
            'tag' as interest_type,
            UNNEST(bc.tags) as interest_value,
            COUNT(*) * 2.5 as weight
        FROM class_participants cp
        JOIN book_classes bc ON bc.id = cp.class_id
        WHERE cp.user_id = p_user_id AND bc.tags IS NOT NULL
        GROUP BY UNNEST(bc.tags)
    )
    
    -- Combine all interests and aggregate weights
    SELECT 
        combined.interest_type,
        combined.interest_value,
        SUM(combined.weight) as total_weight
    FROM (
        SELECT * FROM user_book_interests
        UNION ALL
        SELECT * FROM community_interests
        UNION ALL
        SELECT * FROM class_interests
    ) combined
    WHERE combined.interest_value IS NOT NULL 
    AND LENGTH(TRIM(combined.interest_value)) > 0
    GROUP BY combined.interest_type, combined.interest_value
    ORDER BY total_weight DESC, combined.interest_value;
END;
$function$;