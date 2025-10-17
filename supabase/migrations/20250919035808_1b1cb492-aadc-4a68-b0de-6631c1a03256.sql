-- Fix function search path security warnings

-- Update mask_location_data function with secure search_path
CREATE OR REPLACE FUNCTION public.mask_location_data(
    lat double precision,
    lng double precision,
    city text,
    neighborhood text,
    formatted_address text,
    sharing_level text
) RETURNS jsonb AS $$
BEGIN
    CASE sharing_level
        WHEN 'none' THEN
            RETURN jsonb_build_object(
                'latitude', null,
                'longitude', null,
                'city', null,
                'neighborhood', null,
                'formatted_address', 'Location hidden'
            );
        WHEN 'city' THEN
            RETURN jsonb_build_object(
                'latitude', null,
                'longitude', null,
                'city', city,
                'neighborhood', null,
                'formatted_address', city
            );
        WHEN 'neighborhood' THEN
            RETURN jsonb_build_object(
                'latitude', null,
                'longitude', null,
                'city', city,
                'neighborhood', neighborhood,
                'formatted_address', COALESCE(neighborhood || ', ' || city, city)
            );
        WHEN 'exact' THEN
            RETURN jsonb_build_object(
                'latitude', lat,
                'longitude', lng,
                'city', city,
                'neighborhood', neighborhood,
                'formatted_address', formatted_address
            );
        ELSE
            -- Default to city level
            RETURN jsonb_build_object(
                'latitude', null,
                'longitude', null,
                'city', city,
                'neighborhood', null,
                'formatted_address', city
            );
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Update get_user_books_with_privacy function with secure search_path
CREATE OR REPLACE FUNCTION public.get_user_books_with_privacy(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid, 
    user_id uuid, 
    title text, 
    author text,
    code text,
    genre text,
    tags text[],
    cover_url text,
    acquisition_method text,
    previous_owner text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    location_data jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ub.id,
        ub.user_id,
        ub.title,
        ub.author,
        ub.code,
        ub.genre,
        ub.tags,
        ub.cover_url,
        ub.acquisition_method,
        ub.previous_owner,
        ub.notes,
        ub.created_at,
        ub.updated_at,
        mask_location_data(
            ub.latitude, 
            ub.longitude, 
            ub.city, 
            ub.neighborhood, 
            ub.formatted_address,
            COALESCE(p.location_sharing_level, 'city')
        ) as location_data
    FROM user_books ub
    JOIN profiles p ON p.user_id = ub.user_id
    WHERE ub.user_id = target_user_id
    AND (
        -- User can see their own books
        ub.user_id = auth.uid()
        -- Or user can see books from non-private profiles
        OR (NOT p.is_private)
        -- Or user is following the book owner
        OR (auth.uid() IN (
            SELECT follower_id FROM followers 
            WHERE following_id = ub.user_id
        ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Update track_credential_access function with secure search_path
CREATE OR REPLACE FUNCTION public.track_credential_access(p_class_id uuid)
RETURNS void AS $$
BEGIN
    -- Update access tracking
    UPDATE class_meeting_credentials 
    SET 
        last_accessed_at = now(),
        access_count = access_count + 1
    WHERE class_id = p_class_id;
    
    -- Log the access
    INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
    VALUES (p_class_id, auth.uid(), 'ACCESS_TRACKED', inet_client_addr());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Update auto_expire_credentials function with secure search_path
CREATE OR REPLACE FUNCTION public.auto_expire_credentials()
RETURNS trigger AS $$
BEGIN
    -- Set expiration to 24 hours from creation for new credentials
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = now() + interval '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';