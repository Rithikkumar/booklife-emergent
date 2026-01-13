-- Create table for pre-generated book codes (stickers without owners yet)
CREATE TABLE public.book_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID
);

-- Create index for faster code lookups
CREATE INDEX idx_book_codes_code ON public.book_codes(code);
CREATE INDEX idx_book_codes_created_by ON public.book_codes(created_by);
CREATE INDEX idx_book_codes_unclaimed ON public.book_codes(code) WHERE claimed_by IS NULL;

-- Enable Row Level Security
ALTER TABLE public.book_codes ENABLE ROW LEVEL SECURITY;

-- Users can create codes
CREATE POLICY "Users can create book codes"
ON public.book_codes
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Anyone authenticated can view codes (needed for claiming)
CREATE POLICY "Authenticated users can view book codes"
ON public.book_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can claim unclaimed codes
CREATE POLICY "Users can claim unclaimed codes"
ON public.book_codes
FOR UPDATE
USING (claimed_by IS NULL)
WITH CHECK (auth.uid() = claimed_by);

-- Users can delete their own unclaimed codes
CREATE POLICY "Users can delete their own unclaimed codes"
ON public.book_codes
FOR DELETE
USING (auth.uid() = created_by AND claimed_by IS NULL);