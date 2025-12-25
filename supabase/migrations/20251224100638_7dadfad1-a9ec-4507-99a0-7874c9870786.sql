CREATE OR REPLACE FUNCTION public.get_all_book_classes(search_query text DEFAULT NULL::text, filter_categories text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, title text, description text, book_title text, book_author text, book_cover_url text, category text, tags text[], scheduled_date timestamp with time zone, duration_minutes integer, max_participants integer, platform text, platform_join_url text, status text, host_name text, host_username text, host_user_id uuid, participant_count bigint, created_at timestamp with time zone)
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
        bc.user_id as host_user_id,
        COALESCE(pc.count, 0::bigint) as participant_count,
        bc.created_at
    FROM book_classes bc
    LEFT JOIN profiles p ON p.user_id = bc.user_id
    LEFT JOIN (
        SELECT class_id, COUNT(*) as count
        FROM class_participants
        GROUP BY class_id
    ) pc ON pc.class_id = bc.id
    WHERE 
        -- Exclude ended classes: if scheduled_date + duration has passed, don't show
        (
            bc.scheduled_date IS NULL  -- Show drafts/unscheduled
            OR bc.status = 'live'  -- Always show live classes
            OR (
                -- Show if class hasn't ended yet
                bc.scheduled_date + (COALESCE(bc.duration_minutes, 60) * interval '1 minute') > now()
            )
        )
        AND bc.status != 'ended'  -- Explicitly exclude ended status
        AND (
            search_query IS NULL 
            OR search_query = '' 
            OR bc.title ILIKE '%' || search_query || '%'
            OR bc.description ILIKE '%' || search_query || '%'
            OR bc.book_title ILIKE '%' || search_query || '%'
            OR bc.book_author ILIKE '%' || search_query || '%'
            OR p.username ILIKE '%' || search_query || '%'
            OR p.display_name ILIKE '%' || search_query || '%'
            OR bc.category ILIKE '%' || search_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(bc.tags) AS tag 
                WHERE tag ILIKE '%' || search_query || '%'
            )
        )
        AND (
            filter_categories IS NULL 
            OR array_length(filter_categories, 1) IS NULL
            OR bc.category = ANY(filter_categories)
        )
    ORDER BY 
        CASE WHEN bc.status = 'live' THEN 0 WHEN bc.status = 'scheduled' THEN 1 ELSE 2 END,
        bc.scheduled_date ASC NULLS LAST,
        bc.created_at DESC;
END;
$function$;