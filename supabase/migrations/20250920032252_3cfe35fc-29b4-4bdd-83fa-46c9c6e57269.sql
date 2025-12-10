-- Fix the search path security issue for the story edit tracking function
CREATE OR REPLACE FUNCTION public.update_story_edit_tracking()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if the notes field has changed
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = now();
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;