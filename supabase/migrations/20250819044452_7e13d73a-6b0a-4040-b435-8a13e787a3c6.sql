-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption functions that use the secret key
CREATE OR REPLACE FUNCTION encrypt_credential(credential TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from vault (Supabase secrets)
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CREDENTIALS_ENCRYPTION_KEY';
    
    IF encryption_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;
    
    IF credential IS NULL OR credential = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN encode(encrypt(credential::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_credential(encrypted_credential TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from vault (Supabase secrets)
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CREDENTIALS_ENCRYPTION_KEY';
    
    IF encryption_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not found in vault';
    END IF;
    
    IF encrypted_credential IS NULL OR encrypted_credential = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN convert_from(decrypt(decode(encrypted_credential, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for encrypted credentials that automatically decrypts for authorized users
CREATE OR REPLACE VIEW class_meeting_credentials_decrypted AS
SELECT 
    id,
    class_id,
    decrypt_credential(platform_access_token) as platform_access_token,
    decrypt_credential(platform_refresh_token) as platform_refresh_token,
    decrypt_credential(platform_password) as platform_password,
    created_at,
    updated_at
FROM class_meeting_credentials
WHERE class_id IN (
    SELECT id FROM book_classes 
    WHERE user_id = auth.uid()
);

-- Grant access to the view
GRANT SELECT ON class_meeting_credentials_decrypted TO authenticated;

-- Encrypt existing credentials (if any)
UPDATE class_meeting_credentials 
SET 
    platform_access_token = encrypt_credential(platform_access_token),
    platform_refresh_token = encrypt_credential(platform_refresh_token),
    platform_password = encrypt_credential(platform_password)
WHERE platform_access_token IS NOT NULL 
   OR platform_refresh_token IS NOT NULL 
   OR platform_password IS NOT NULL;