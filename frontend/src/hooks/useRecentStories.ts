import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentStory {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: string;
  city: string;
  notes: string;
  created_at: string;
  tags: string[];
  profile: {
    username: string;
    display_name: string | null;
  };
}

export const useRecentStories = () => {
  const [stories, setStories] = useState<RecentStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentStories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recent book registrations with profile information
        const { data, error: fetchError } = await supabase
          .from('user_books')
          .select(`
            id,
            user_id,
            title,
            author,
            genre,
            city,
            notes,
            created_at,
            tags
          `)
          .not('city', 'is', null) // Only books with cities (for journey visualization)
          .not('notes', 'is', null) // Only books with notes (stories)
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) {
          throw fetchError;
        }

        // Fetch profiles separately to avoid relation issues
        const userIds = data?.map(book => book.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);

        // Create a profiles lookup map
        const profilesMap = new Map(
          profilesData?.map(profile => [profile.user_id, profile]) || []
        );

        // Transform the data to match our interface
        const transformedStories: RecentStory[] = (data || []).map(item => {
          const profile = profilesMap.get(item.user_id);
          return {
            id: item.id,
            user_id: item.user_id,
            title: item.title,
            author: item.author,
            genre: item.genre || 'Unknown',
            city: item.city || 'Unknown',
            notes: item.notes || '',
            created_at: item.created_at,
            tags: item.tags || [],
            profile: {
              username: profile?.username || 'unknown',
              display_name: profile?.display_name || 'Unknown User'
            }
          };
        });

        setStories(transformedStories);
      } catch (err) {
        console.error('Error fetching recent stories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent stories');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentStories();
  }, []);

  return { stories, loading, error };
};