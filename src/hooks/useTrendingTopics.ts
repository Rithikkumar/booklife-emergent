import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingTopic {
  tag: string;
  count: number;
}

export const useTrendingTopics = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all community tags
        const { data: communities, error: communitiesError } = await supabase
          .from('communities')
          .select('tags, member_count')
          .eq('is_public', true);

        if (communitiesError) throw communitiesError;

        // Count tag frequencies weighted by member count
        const tagCounts: Record<string, number> = {};
        
        communities?.forEach(community => {
          if (community.tags && Array.isArray(community.tags)) {
            community.tags.forEach((tag: string) => {
              const normalizedTag = tag.toLowerCase();
              tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + (community.member_count || 1);
            });
          }
        });

        // Convert to array and sort by count
        const sortedTopics = Object.entries(tagCounts)
          .map(([tag, count]) => ({ 
            tag: `#${tag}`, 
            count 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 topics

        setTrendingTopics(sortedTopics);
      } catch (err) {
        console.error('Error fetching trending topics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trending topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  return { trendingTopics, loading, error };
};