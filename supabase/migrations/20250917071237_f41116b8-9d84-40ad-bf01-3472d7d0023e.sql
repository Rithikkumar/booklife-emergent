-- Fix search path for the functions created in the previous migration
CREATE OR REPLACE FUNCTION validate_message_content()
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(NEW.message) = 0 THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;
    
    IF LENGTH(NEW.message) > 2000 THEN
        RAISE EXCEPTION 'Message cannot exceed 2000 characters';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM community_typing_indicators 
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;