-- Create a secure RPC function for inserting encrypted credentials
CREATE OR REPLACE FUNCTION encrypt_and_store_credentials(
    p_class_id UUID,
    p_access_token TEXT DEFAULT NULL,
    p_refresh_token TEXT DEFAULT NULL,
    p_password TEXT DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow class owners to store credentials
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only class owners can store credentials';
    END IF;

    -- Insert encrypted credentials
    INSERT INTO class_meeting_credentials (
        class_id, 
        platform_access_token, 
        platform_refresh_token, 
        platform_password
    ) VALUES (
        p_class_id,
        encrypt_credential(p_access_token),
        encrypt_credential(p_refresh_token), 
        encrypt_credential(p_password)
    )
    ON CONFLICT (class_id) DO UPDATE SET
        platform_access_token = encrypt_credential(p_access_token),
        platform_refresh_token = encrypt_credential(p_refresh_token),
        platform_password = encrypt_credential(p_password),
        updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_and_store_credentials TO authenticated;