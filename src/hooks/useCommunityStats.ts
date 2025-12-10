import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityStats {
  activeCommunities: number;
  totalMembers: number;
  totalMessages: number;
}

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats>({
    activeCommunities: 0,
    totalMembers: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get active communities count
        const { count: communitiesCount, error: communitiesError } = await supabase
          .from('communities')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true);

        if (communitiesError) throw communitiesError;

        // Get total members count
        const { count: membersCount, error: membersError } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true });

        if (membersError) throw membersError;

        // Get total messages count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('community_messages')
          .select('*', { count: 'exact', head: true });

        if (messagesError) throw messagesError;

        setStats({
          activeCommunities: communitiesCount || 0,
          totalMembers: membersCount || 0,
          totalMessages: messagesCount || 0
        });
      } catch (err) {
        console.error('Error fetching community stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};