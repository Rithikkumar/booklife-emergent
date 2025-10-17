-- Transform favorite_books table to followed_books table
ALTER TABLE public.favorite_books RENAME TO followed_books;

-- Remove columns not needed for following journeys
ALTER TABLE public.followed_books DROP COLUMN IF EXISTS book_cover_url;
ALTER TABLE public.followed_books DROP COLUMN IF EXISTS notes;

-- Rename created_at to followed_at for better semantics
ALTER TABLE public.followed_books RENAME COLUMN created_at TO followed_at;

-- Add new columns for following functionality
ALTER TABLE public.followed_books 
ADD COLUMN notification_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN last_activity_check TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Users can add favorite books" ON public.followed_books;
DROP POLICY IF EXISTS "Users can delete their favorite books" ON public.followed_books;
DROP POLICY IF EXISTS "Users can update their favorite books" ON public.followed_books;
DROP POLICY IF EXISTS "Users can view their own favorite books" ON public.followed_books;

-- Create new RLS policies for followed_books
CREATE POLICY "Users can follow books" 
ON public.followed_books 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow books" 
ON public.followed_books 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their followed books" 
ON public.followed_books 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own followed books" 
ON public.followed_books 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_followed_books_user_id ON public.followed_books(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_books_book_lookup ON public.followed_books(book_title, book_author);