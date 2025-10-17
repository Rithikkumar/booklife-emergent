-- Drop the problematic security definer view
DROP VIEW IF EXISTS class_meeting_credentials_decrypted;

-- Update encryption functions with proper search_path
DROP FUNCTION IF EXISTS encrypt_credential(TEXT);
DROP FUNCTION IF EXISTS decrypt_credential(TEXT);

-- Create secure encryption functions
CREATE OR REPLACE FUNCTION encrypt_credential(credential TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, vault
AS $$
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
$$;

-- Create secure decryption function  
CREATE OR REPLACE FUNCTION decrypt_credential(encrypted_credential TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, vault
AS $$
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
$$;