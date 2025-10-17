-- Create a separate table for sensitive meeting credentials
CREATE TABLE public.class_meeting_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL UNIQUE,
  platform_access_token TEXT,
  platform_refresh_token TEXT,
  platform_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.class_meeting_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only class owners can access credentials
CREATE POLICY "Only class owners can manage meeting credentials"
ON public.class_meeting_credentials
FOR ALL
USING (
  class_id IN (
    SELECT id FROM public.book_classes 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  class_id IN (
    SELECT id FROM public.book_classes 
    WHERE user_id = auth.uid()
  )
);

-- Migrate existing credentials to the new table
INSERT INTO public.class_meeting_credentials (
  class_id, 
  platform_access_token, 
  platform_refresh_token, 
  platform_password
)
SELECT 
  id,
  platform_access_token,
  platform_refresh_token,
  platform_password
FROM public.book_classes
WHERE platform_access_token IS NOT NULL 
   OR platform_refresh_token IS NOT NULL 
   OR platform_password IS NOT NULL;

-- Remove sensitive columns from book_classes table
ALTER TABLE public.book_classes 
DROP COLUMN IF EXISTS platform_access_token,
DROP COLUMN IF EXISTS platform_refresh_token,
DROP COLUMN IF EXISTS platform_password;

-- Update RLS policy to allow participants to view class details (excluding sensitive data)
DROP POLICY IF EXISTS "Users can view their own classes" ON public.book_classes;

CREATE POLICY "Class owners and participants can view class details"
ON public.book_classes
FOR SELECT
USING (
  -- Class owner can see their classes
  auth.uid() = user_id
  OR
  -- Participants can see classes they've joined
  id IN (
    SELECT class_id FROM public.class_participants 
    WHERE user_id = auth.uid()
  )
);

-- Add trigger for automatic timestamp updates on credentials table
CREATE TRIGGER update_class_meeting_credentials_updated_at
BEFORE UPDATE ON public.class_meeting_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();