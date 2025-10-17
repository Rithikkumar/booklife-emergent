-- Create book_clubs table
CREATE TABLE public.book_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover_url TEXT,
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 50,
  is_public BOOLEAN NOT NULL DEFAULT true,
  reading_start_date DATE,
  reading_end_date DATE,
  meeting_schedule TEXT,
  status TEXT NOT NULL DEFAULT 'recruiting',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_club_members table
CREATE TABLE public.book_club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reading_progress INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Create book_club_discussions table
CREATE TABLE public.book_club_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chapter_number INTEGER,
  is_spoiler BOOLEAN DEFAULT false,
  reply_to_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_clubs
CREATE POLICY "Anyone can view public book clubs"
ON public.book_clubs FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create book clubs"
ON public.book_clubs FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Club creators can update their clubs"
ON public.book_clubs FOR UPDATE
USING (auth.uid() = created_by);

-- RLS Policies for book_club_members
CREATE POLICY "Users can join book clubs"
ON public.book_club_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave book clubs"
ON public.book_club_members FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view club members"
ON public.book_club_members FOR SELECT
USING (
  club_id IN (
    SELECT id FROM book_clubs WHERE is_public = true
  ) OR 
  user_id = auth.uid() OR 
  club_id IN (
    SELECT club_id FROM book_club_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own membership"
ON public.book_club_members FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for book_club_discussions
CREATE POLICY "Users can view discussions in clubs they're members of"
ON public.book_club_discussions FOR SELECT
USING (
  club_id IN (
    SELECT club_id FROM book_club_members WHERE user_id = auth.uid()
  ) OR 
  club_id IN (
    SELECT id FROM book_clubs WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can create discussions in clubs they're members of"
ON public.book_club_discussions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  club_id IN (
    SELECT club_id FROM book_club_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own discussions"
ON public.book_club_discussions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions"
ON public.book_club_discussions FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update member count
CREATE OR REPLACE FUNCTION public.update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE book_clubs 
    SET updated_at = now() 
    WHERE id = NEW.club_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE book_clubs 
    SET updated_at = now() 
    WHERE id = OLD.club_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member count updates
CREATE TRIGGER update_book_club_member_count
  AFTER INSERT OR DELETE ON book_club_members
  FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- Add updated_at trigger for book_clubs
CREATE TRIGGER update_book_clubs_updated_at
  BEFORE UPDATE ON book_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for book_club_discussions
CREATE TRIGGER update_book_club_discussions_updated_at
  BEFORE UPDATE ON book_club_discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();