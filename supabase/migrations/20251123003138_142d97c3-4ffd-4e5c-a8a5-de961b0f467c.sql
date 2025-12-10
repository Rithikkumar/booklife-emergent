-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_message_before_insert ON public.community_messages;
DROP TRIGGER IF EXISTS update_member_activity_after_message ON public.community_messages;

-- Function to validate and sanitize community messages
CREATE OR REPLACE FUNCTION public.validate_community_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate message length
  IF LENGTH(TRIM(NEW.message)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  IF LENGTH(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message cannot exceed 2000 characters';
  END IF;
  
  -- Sanitize message (XSS prevention)
  NEW.message := REPLACE(REPLACE(TRIM(NEW.message), '<', '&lt;'), '>', '&gt;');
  
  -- Set default message type if not provided
  IF NEW.message_type IS NULL THEN
    NEW.message_type := 'text';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to community_messages table
CREATE TRIGGER validate_message_before_insert
  BEFORE INSERT ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_community_message();

-- Function to update member activity after message
CREATE OR REPLACE FUNCTION public.update_member_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update member's last active timestamp (non-blocking)
  UPDATE public.community_members 
  SET last_active_at = NEW.created_at
  WHERE community_id = NEW.community_id 
    AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to run AFTER insert
CREATE TRIGGER update_member_activity_after_message
  AFTER INSERT ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_activity();