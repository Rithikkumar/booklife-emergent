-- Update the get_live_book_classes function to support search and filtering
CREATE OR REPLACE FUNCTION public.get_live_book_classes(
    search_query text DEFAULT NULL,
    filter_categories text[] DEFAULT NULL,
    include_upcoming boolean DEFAULT true
)
RETURNS TABLE(
    id uuid, 
    title text, 
    description text, 
    book_title text, 
    book_author text, 
    book_cover_url text, 
    category text, 
    tags text[], 
    scheduled_date timestamp with time zone, 
    duration_minutes integer, 
    max_participants integer, 
    platform text, 
    platform_join_url text, 
    status text, 
    host_name text, 
    host_username text, 
    participant_count bigint, 
    is_ongoing boolean, 
    minutes_since_start integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        bc.id,
        bc.title,
        bc.description,
        bc.book_title,
        bc.book_author,
        bc.book_cover_url,
        bc.category,
        bc.tags,
        bc.scheduled_date,
        bc.duration_minutes,
        bc.max_participants,
        bc.platform,
        bc.platform_join_url,
        bc.status,
        COALESCE(p.display_name, p.username) as host_name,
        p.username as host_username,
        COALESCE(participant_counts.count, 0) as participant_count,
        -- Check if class is currently ongoing
        (
            bc.scheduled_date IS NOT NULL 
            AND bc.scheduled_date <= now() + interval '15 minutes'
            AND (bc.duration_minutes IS NULL OR bc.scheduled_date + interval '1 minute' * bc.duration_minutes >= now())
            AND bc.status = 'live'
        ) as is_ongoing,
        -- Calculate minutes since start
        CASE 
            WHEN bc.scheduled_date IS NOT NULL AND bc.scheduled_date <= now() 
            THEN EXTRACT(EPOCH FROM (now() - bc.scheduled_date))::integer / 60
            ELSE NULL
        END as minutes_since_start
    FROM book_classes bc
    LEFT JOIN profiles p ON p.user_id = bc.user_id
    LEFT JOIN (
        SELECT class_id, COUNT(*) as count
        FROM class_participants
        GROUP BY class_id
    ) participant_counts ON participant_counts.class_id = bc.id
    WHERE 
        bc.status IN ('live', 'scheduled')
        AND bc.scheduled_date IS NOT NULL
        AND (
            -- Currently live
            (bc.scheduled_date <= now() + interval '15 minutes'
            AND (bc.duration_minutes IS NULL OR bc.scheduled_date + interval '1 minute' * bc.duration_minutes >= now())
            AND bc.status = 'live')
            OR
            -- Include upcoming classes if requested
            (include_upcoming AND bc.scheduled_date > now() AND bc.status = 'scheduled')
        )
        -- Search filtering
        AND (
            search_query IS NULL 
            OR search_query = '' 
            OR bc.title ILIKE '%' || search_query || '%'
            OR bc.description ILIKE '%' || search_query || '%'
            OR bc.book_title ILIKE '%' || search_query || '%'
            OR bc.book_author ILIKE '%' || search_query || '%'
            OR p.username ILIKE '%' || search_query || '%'
            OR p.display_name ILIKE '%' || search_query || '%'
            OR EXISTS (
                SELECT 1 FROM UNNEST(bc.tags) AS tag 
                WHERE tag ILIKE '%' || search_query || '%'
            )
        )
        -- Category filtering
        AND (
            filter_categories IS NULL 
            OR array_length(filter_categories, 1) IS NULL
            OR bc.category = ANY(filter_categories)
            OR EXISTS (
                SELECT 1 FROM UNNEST(bc.tags) AS tag 
                WHERE tag = ANY(filter_categories)
            )
        )
    ORDER BY 
        -- Prioritize currently live classes
        CASE WHEN bc.status = 'live' AND bc.scheduled_date <= now() THEN 0 ELSE 1 END,
        bc.scheduled_date ASC;
END;
$function$;