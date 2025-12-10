-- Enhanced security for meeting credentials table
-- Add additional constraints and improve RLS policies

-- First, ensure the credentials table has proper constraints
ALTER TABLE class_meeting_credentials 
ADD CONSTRAINT chk_credentials_not_empty 
CHECK (
  platform_access_token IS NOT NULL OR 
  platform_refresh_token IS NOT NULL OR 
  platform_password IS NOT NULL
);

-- Drop existing RLS policy to replace with more restrictive one
DROP POLICY IF EXISTS "Only class owners can manage meeting credentials" ON class_meeting_credentials;

-- Create more restrictive RLS policies with explicit operations
CREATE POLICY "Class owners can insert meeting credentials"
ON class_meeting_credentials 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM book_classes 
    WHERE id = class_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Class owners can update meeting credentials"
ON class_meeting_credentials 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM book_classes 
    WHERE id = class_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM book_classes 
    WHERE id = class_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Class owners can select meeting credentials"
ON class_meeting_credentials 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM book_classes 
    WHERE id = class_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Class owners can delete meeting credentials"
ON class_meeting_credentials 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM book_classes 
    WHERE id = class_id 
    AND user_id = auth.uid()
  )
);

-- Add additional audit logging function for credential access
CREATE OR REPLACE FUNCTION log_credential_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all credential access attempts
  INSERT INTO credential_access_log (
    class_id,
    user_id,
    action,
    ip_address
  ) VALUES (
    COALESCE(NEW.class_id, OLD.class_id),
    auth.uid(),
    TG_OP,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comprehensive audit logging
DROP TRIGGER IF EXISTS audit_credential_access ON class_meeting_credentials;
CREATE TRIGGER audit_credential_access
  AFTER INSERT OR UPDATE OR DELETE ON class_meeting_credentials
  FOR EACH ROW EXECUTE FUNCTION log_credential_access();

-- Enhance the get_decrypted_credentials function with additional security checks
CREATE OR REPLACE FUNCTION public.get_decrypted_credentials(p_class_id uuid)
RETURNS TABLE(platform_access_token text, platform_refresh_token text, platform_password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Enhanced authorization check with detailed logging
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        -- Log unauthorized access attempt
        INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
        VALUES (p_class_id, auth.uid(), 'UNAUTHORIZED_ATTEMPT', inet_client_addr());
        
        RAISE EXCEPTION 'Unauthorized: Only class owners can access credentials';
    END IF;

    -- Additional check: Ensure class exists and is not deleted/archived
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id 
        AND status NOT IN ('cancelled', 'deleted')
    ) THEN
        RAISE EXCEPTION 'Invalid class: Class not found or is no longer active';
    END IF;

    -- Log successful credential retrieval
    INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
    VALUES (p_class_id, auth.uid(), 'RETRIEVE_SUCCESS', inet_client_addr());

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

-- Update the encrypt_and_store_credentials function with enhanced security
CREATE OR REPLACE FUNCTION public.encrypt_and_store_credentials(
    p_class_id uuid, 
    p_access_token text DEFAULT NULL::text, 
    p_refresh_token text DEFAULT NULL::text, 
    p_password text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Enhanced authorization check
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        -- Log unauthorized access attempt
        INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
        VALUES (p_class_id, auth.uid(), 'UNAUTHORIZED_STORE_ATTEMPT', inet_client_addr());
        
        RAISE EXCEPTION 'Unauthorized: Only class owners can store credentials';
    END IF;

    -- Validate that at least one credential is provided
    IF p_access_token IS NULL AND p_refresh_token IS NULL AND p_password IS NULL THEN
        RAISE EXCEPTION 'Invalid request: At least one credential must be provided';
    END IF;

    -- Log the credential storage action
    INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
    VALUES (p_class_id, auth.uid(), 'STORE_SUCCESS', inet_client_addr());

    -- Insert encrypted credentials with enhanced error handling
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
        platform_access_token = COALESCE(encrypt_credential(p_access_token), class_meeting_credentials.platform_access_token),
        platform_refresh_token = COALESCE(encrypt_credential(p_refresh_token), class_meeting_credentials.platform_refresh_token),
        platform_password = COALESCE(encrypt_credential(p_password), class_meeting_credentials.platform_password),
        updated_at = now();
END;
$$;