-- Add neighborhood and district fields to user_books table for more granular location tracking
ALTER TABLE user_books 
ADD COLUMN neighborhood TEXT,
ADD COLUMN district TEXT,
ADD COLUMN formatted_address TEXT;