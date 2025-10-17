-- Create a function to generate and store a secure encryption key if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_encryption_key()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
DECLARE
    existing_key TEXT;
    new_key TEXT;
BEGIN
    -- Check if encryption key already exists
    SELECT decrypted_secret INTO existing_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CREDENTIALS_ENCRYPTION_KEY';
    
    -- If no key exists, generate a secure random one
    IF existing_key IS NULL THEN
        -- Generate a 256-bit (32 byte) random key
        new_key := encode(gen_random_bytes(32), 'hex');
        
        -- Store the key in vault
        INSERT INTO vault.secrets (name, secret) 
        VALUES ('CREDENTIALS_ENCRYPTION_KEY', new_key);
    END IF;
END;
$$;

-- Update the encrypt_credential function to auto-generate key if needed
CREATE OR REPLACE FUNCTION public.encrypt_credential(credential text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Ensure encryption key exists
    PERFORM public.ensure_encryption_key();
    
    -- Get encryption key from vault
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CREDENTIALS_ENCRYPTION_KEY';
    
    IF encryption_key IS NULL THEN
        RAISE EXCEPTION 'Failed to retrieve or generate encryption key';
    END IF;
    
    IF credential IS NULL OR credential = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN encode(encrypt(credential::bytea, decode(encryption_key, 'hex'), 'aes'), 'base64');
END;
$$;

-- Update the decrypt_credential function to auto-generate key if needed
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_credential text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Ensure encryption key exists
    PERFORM public.ensure_encryption_key();
    
    -- Get encryption key from vault
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CREDENTIALS_ENCRYPTION_KEY';
    
    IF encryption_key IS NULL THEN
        RAISE EXCEPTION 'Failed to retrieve or generate encryption key';
    END IF;
    
    IF encrypted_credential IS NULL OR encrypted_credential = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN convert_from(decrypt(decode(encrypted_credential, 'base64'), decode(encryption_key, 'hex'), 'aes'), 'UTF8');
END;
$$;

-- Add security audit table for credential access logging
CREATE TABLE IF NOT EXISTS public.credential_access_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'store', 'retrieve')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.credential_access_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs
CREATE POLICY "Users can view their own credential audit logs" 
ON public.credential_access_log 
FOR SELECT 
USING (user_id = auth.uid());

-- Update the credential storage function to include audit logging
CREATE OR REPLACE FUNCTION public.encrypt_and_store_credentials(p_class_id uuid, p_access_token text DEFAULT NULL::text, p_refresh_token text DEFAULT NULL::text, p_password text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow class owners to store credentials
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only class owners can store credentials';
    END IF;

    -- Log the credential storage action
    INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
    VALUES (p_class_id, auth.uid(), 'store', inet_client_addr());

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

-- Update the credential retrieval function to include audit logging
CREATE OR REPLACE FUNCTION public.get_decrypted_credentials(p_class_id uuid)
RETURNS TABLE(platform_access_token text, platform_refresh_token text, platform_password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow class owners to retrieve credentials
    IF NOT EXISTS (
        SELECT 1 FROM book_classes 
        WHERE id = p_class_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only class owners can access credentials';
    END IF;

    -- Log the credential access action
    INSERT INTO credential_access_log (class_id, user_id, action, ip_address)
    VALUES (p_class_id, auth.uid(), 'retrieve', inet_client_addr());

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