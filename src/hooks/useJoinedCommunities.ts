import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types';

export const useJoinedCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoinedCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      // Fetch community IDs the user has joined
      const { data: membershipData, error: membershipError } = await supabase
        .from('community_members')
        .select('community_id, joined_at')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setCommunities([]);
        return;
      }

      // Fetch the actual community details
      const communityIds = membershipData.map(m => m.community_id);
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .in('id', communityIds);

      if (communitiesError) throw communitiesError;

      // Format the data
      const formattedCommunities: Community[] = (communitiesData || []).map(community => ({
        id: community.id,
        name: community.name,
        members: community.member_count,
        description: community.description,
        tags: community.tags || [],
        recentActivity: 'today',
        isJoined: true,
        createdBy: community.created_by,
        isCreatedByUser: user.id === community.created_by,
        isRecommended: false,
        is_public: community.is_public,
        restrict_messaging: community.restrict_messaging
      }));

      setCommunities(formattedCommunities);
    } catch (err) {
      console.error('Error fetching joined communities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch joined communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinedCommunities();
  }, []);

  const refreshCommunities = () => {
    fetchJoinedCommunities();
  };

  return {
    communities,
    loading,
    error,
    refreshCommunities
  };
};