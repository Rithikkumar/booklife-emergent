-- Fix security warnings from the previous migration
-- Set proper search_path for all functions to prevent security vulnerabilities

-- Fix the log_credential_access function with proper search_path
CREATE OR REPLACE FUNCTION log_credential_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;