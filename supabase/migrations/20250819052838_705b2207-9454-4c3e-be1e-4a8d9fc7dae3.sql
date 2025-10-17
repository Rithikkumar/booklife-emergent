-- Create a secure RPC function for retrieving decrypted credentials
CREATE OR REPLACE FUNCTION get_decrypted_credentials(p_class_id UUID)
RETURNS TABLE (
    platform_access_token TEXT,
    platform_refresh_token TEXT,
    platform_password TEXT
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow class owners to retrieve credentials
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only class owners can access credentials';
    END IF;

    -- Return decrypted credentials
    RETURN QUERY 
    SELECT 
        decrypt_credential(c.platform_access_token) as platform_access_token,
        decrypt_credential(c.platform_refresh_token) as platform_refresh_token,
        decrypt_credential(c.platform_password) as platform_password
    FROM class_meeting_credentials c
    WHERE c.class_id = p_class_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_decrypted_credentials TO authenticated;