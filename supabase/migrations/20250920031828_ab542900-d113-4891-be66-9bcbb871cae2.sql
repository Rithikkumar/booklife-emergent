-- Phase 1: Add story editing tracking columns to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Create function to update edited tracking when story is modified
CREATE OR REPLACE FUNCTION public.update_story_edit_tracking()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track story edits
DROP TRIGGER IF EXISTS trigger_update_story_edit_tracking ON public.user_books;
CREATE TRIGGER trigger_update_story_edit_tracking
  BEFORE UPDATE ON public.user_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_edit_tracking();