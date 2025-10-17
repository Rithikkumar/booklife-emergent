-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  profile_picture_url TEXT,
  cover_photo_url TEXT,
  is_private BOOLEAN DEFAULT false,
  show_location BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  book_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create followers table
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create saved posts table
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create favorite books table
CREATE TABLE public.favorite_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user books (registered books) table
CREATE TABLE public.user_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  code TEXT,
  city TEXT,
  acquisition_method TEXT CHECK (acquisition_method IN ('bookstore', 'friend', 'online', 'gift')),
  previous_owner TEXT,
  notes TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profiles or their own" ON public.profiles
FOR SELECT USING (
  NOT is_private OR 
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT follower_id FROM public.followers 
    WHERE following_id = profiles.user_id
  )
);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for posts
CREATE POLICY "Users can view posts from public profiles or followed users" ON public.posts
FOR SELECT USING (
  user_id IN (
    SELECT user_id FROM public.profiles 
    WHERE NOT is_private OR 
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT follower_id FROM public.followers 
      WHERE following_id = profiles.user_id
    )
  )
);

CREATE POLICY "Users can create their own posts" ON public.posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for followers
CREATE POLICY "Users can view their own followers/following" ON public.followers
FOR SELECT USING (
  follower_id = auth.uid() OR 
  following_id = auth.uid() OR
  following_id IN (
    SELECT user_id FROM public.profiles WHERE NOT is_private
  )
);

CREATE POLICY "Users can follow others" ON public.followers
FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.followers
FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for saved posts
CREATE POLICY "Users can view their own saved posts" ON public.saved_posts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON public.saved_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" ON public.saved_posts
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for favorite books
CREATE POLICY "Users can view their own favorite books" ON public.favorite_books
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite books" ON public.favorite_books
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their favorite books" ON public.favorite_books
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorite books" ON public.favorite_books
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user books
CREATE POLICY "Users can view books from public profiles or followed users" ON public.user_books
FOR SELECT USING (
  user_id IN (
    SELECT user_id FROM public.profiles 
    WHERE NOT is_private OR 
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT follower_id FROM public.followers 
      WHERE following_id = profiles.user_id
    )
  )
);

CREATE POLICY "Users can add their own books" ON public.user_books
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON public.user_books
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON public.user_books
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post likes
CREATE POLICY "Users can view likes on visible posts" ON public.post_likes
FOR SELECT USING (
  post_id IN (
    SELECT id FROM public.posts WHERE user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE NOT is_private OR 
      user_id = auth.uid() OR 
      auth.uid() IN (
        SELECT follower_id FROM public.followers 
        WHERE following_id = profiles.user_id
      )
    )
  )
);

CREATE POLICY "Users can like posts" ON public.post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post comments
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments
FOR SELECT USING (
  post_id IN (
    SELECT id FROM public.posts WHERE user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE NOT is_private OR 
      user_id = auth.uid() OR 
      auth.uid() IN (
        SELECT follower_id FROM public.followers 
        WHERE following_id = profiles.user_id
      )
    )
  )
);

CREATE POLICY "Users can comment on posts" ON public.post_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.post_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);
CREATE INDEX idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX idx_favorite_books_user_id ON public.favorite_books(user_id);
CREATE INDEX idx_user_books_user_id ON public.user_books(user_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
  BEFORE UPDATE ON public.user_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();