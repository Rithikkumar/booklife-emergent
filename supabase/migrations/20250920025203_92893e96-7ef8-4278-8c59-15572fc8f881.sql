-- Create table for story comments
CREATE TABLE public.book_story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  commenter_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for story reactions  
CREATE TABLE public.book_story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id, reaction_type)
);

-- Enable RLS on story comments
ALTER TABLE public.book_story_comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on story reactions
ALTER TABLE public.book_story_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for story comments
CREATE POLICY "Users can view story comments" 
ON public.book_story_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create story comments" 
ON public.book_story_comments 
FOR INSERT 
WITH CHECK (auth.uid() = commenter_id);

CREATE POLICY "Users can update their own comments" 
ON public.book_story_comments 
FOR UPDATE 
USING (auth.uid() = commenter_id);

CREATE POLICY "Users can delete their own comments" 
ON public.book_story_comments 
FOR DELETE 
USING (auth.uid() = commenter_id);

-- RLS policies for story reactions
CREATE POLICY "Users can view story reactions" 
ON public.book_story_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create story reactions" 
ON public.book_story_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" 
ON public.book_story_reactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.book_story_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_book_story_comments_updated_at
BEFORE UPDATE ON public.book_story_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();