-- Drop book club related tables and functions

-- Drop tables in correct order to handle foreign key dependencies
DROP TABLE IF EXISTS book_club_discussions CASCADE;
DROP TABLE IF EXISTS book_club_members CASCADE;
DROP TABLE IF EXISTS book_clubs CASCADE;

-- Drop the book club related functions
DROP FUNCTION IF EXISTS public.is_user_in_book_club(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_club_member_count();