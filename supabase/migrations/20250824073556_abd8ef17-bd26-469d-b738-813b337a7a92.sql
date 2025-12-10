-- Create communities table to replace static data
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  activity_score INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  engagement_score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Create user community interactions table
CREATE TABLE public.user_community_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'like', 'comment', 'share', 'join_attempt'
  weight INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_community_interactions ENABLE ROW LEVEL SECURITY;

-- Create recommendation cache table
CREATE TABLE public.community_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID NOT NULL,
  score DECIMAL(5,3) NOT NULL,
  reason TEXT,
  algorithm_type TEXT NOT NULL, -- 'content_based', 'collaborative', 'activity_based', 'social'
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(user_id, community_id, algorithm_type)
);

-- Enable RLS
ALTER TABLE public.community_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Anyone can view public communities" 
ON public.communities 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators can update their communities" 
ON public.communities 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for community members
CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view community members" 
ON public.community_members 
FOR SELECT 
USING (
  community_id IN (
    SELECT id FROM communities WHERE is_public = true
  ) OR
  user_id = auth.uid() OR
  community_id IN (
    SELECT community_id FROM community_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can leave communities" 
ON public.community_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for interactions
CREATE POLICY "Users can create their own interactions" 
ON public.user_community_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions" 
ON public.user_community_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.community_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage recommendations" 
ON public.community_recommendations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_communities_tags ON public.communities USING GIN(tags);
CREATE INDEX idx_communities_category ON public.communities(category);
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_members_community ON public.community_members(community_id);
CREATE INDEX idx_interactions_user ON public.user_community_interactions(user_id);
CREATE INDEX idx_interactions_community ON public.user_community_interactions(community_id);
CREATE INDEX idx_interactions_type ON public.user_community_interactions(interaction_type);
CREATE INDEX idx_recommendations_user ON public.community_recommendations(user_id);
CREATE INDEX idx_recommendations_expires ON public.community_recommendations(expires_at);

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update member count
CREATE TRIGGER trigger_update_community_member_count
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

-- Function to clean expired recommendations
CREATE OR REPLACE FUNCTION clean_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM community_recommendations 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Insert sample communities from the static data
INSERT INTO public.communities (name, description, tags, category, member_count, activity_score, created_by) VALUES
('Fantasy Book Lovers', 'A community for fans of fantasy literature, from epic adventures to urban fantasy.', ARRAY['fantasy', 'fiction', 'adventure'], 'Fiction', 2847, 95, '00000000-0000-0000-0000-000000000000'),
('Science Fiction Hub', 'Exploring the future through science fiction novels and discussions.', ARRAY['sci-fi', 'future', 'technology'], 'Fiction', 1923, 88, '00000000-0000-0000-0000-000000000000'),
('Mystery & Thriller', 'For those who love suspenseful reads and plot twists.', ARRAY['mystery', 'thriller', 'suspense'], 'Fiction', 1456, 92, '00000000-0000-0000-0000-000000000000'),
('Non-Fiction Readers', 'Sharing insights from biographies, self-help, and educational books.', ARRAY['non-fiction', 'biography', 'education'], 'Non-Fiction', 987, 76, '00000000-0000-0000-0000-000000000000'),
('Book Club Central', 'Coordinate reading schedules and discuss monthly picks.', ARRAY['book-club', 'discussion', 'monthly'], 'Community', 2134, 89, '00000000-0000-0000-0000-000000000000'),
('Young Adult Fans', 'Celebrating coming-of-age stories and YA literature.', ARRAY['young-adult', 'ya', 'teen'], 'Fiction', 1678, 85, '00000000-0000-0000-0000-000000000000'),
('Classic Literature', 'Discussing timeless works and their modern relevance.', ARRAY['classics', 'literature', 'timeless'], 'Literature', 834, 72, '00000000-0000-0000-0000-000000000000'),
('Romance Readers', 'For those who believe in happily ever after.', ARRAY['romance', 'love', 'relationships'], 'Fiction', 2567, 94, '00000000-0000-0000-0000-000000000000');