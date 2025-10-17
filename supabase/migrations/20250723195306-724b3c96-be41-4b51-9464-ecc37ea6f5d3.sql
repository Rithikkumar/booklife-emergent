-- Create table for book classes with platform integration
CREATE TABLE public.book_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  book_title TEXT,
  book_author TEXT,
  book_cover_url TEXT,
  category TEXT,
  tags TEXT[],
  scheduled_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  max_participants INTEGER DEFAULT 20,
  platform TEXT NOT NULL CHECK (platform IN ('zoom', 'webex', 'google_meet', 'youtube_live')),
  platform_meeting_id TEXT,
  platform_meeting_url TEXT,
  platform_join_url TEXT,
  platform_password TEXT,
  platform_access_token TEXT,
  platform_refresh_token TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.book_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own classes" 
ON public.book_classes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own classes" 
ON public.book_classes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" 
ON public.book_classes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" 
ON public.book_classes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for class participants
CREATE TABLE public.class_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.book_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for participants
ALTER TABLE public.class_participants ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Users can view class participants if they're the host or participant" 
ON public.class_participants 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM public.book_classes WHERE id = class_id)
);

CREATE POLICY "Users can join classes" 
ON public.class_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create table for YouTube Live chat messages
CREATE TABLE public.class_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.book_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'question', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for chat messages
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view chat messages for classes they're in" 
ON public.class_chat_messages 
FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM public.class_participants WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.book_classes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send chat messages for classes they're in" 
ON public.class_chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  class_id IN (
    SELECT class_id FROM public.class_participants WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.book_classes WHERE user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_book_classes_updated_at
  BEFORE UPDATE ON public.book_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_book_classes_user_id ON public.book_classes(user_id);
CREATE INDEX idx_book_classes_platform ON public.book_classes(platform);
CREATE INDEX idx_book_classes_scheduled_date ON public.book_classes(scheduled_date);
CREATE INDEX idx_class_participants_class_id ON public.class_participants(class_id);
CREATE INDEX idx_class_participants_user_id ON public.class_participants(user_id);
CREATE INDEX idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);