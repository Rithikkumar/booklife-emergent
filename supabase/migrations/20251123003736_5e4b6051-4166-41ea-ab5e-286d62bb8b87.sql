-- Optimize update_member_activity to only update every 5 minutes
CREATE OR REPLACE FUNCTION public.update_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if last_active_at is NULL or older than 5 minutes
  UPDATE public.community_members 
  SET last_active_at = NEW.created_at
  WHERE community_id = NEW.community_id 
    AND user_id = NEW.user_id
    AND (
      last_active_at IS NULL 
      OR last_active_at < (NEW.created_at - INTERVAL '5 minutes')
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';