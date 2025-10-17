import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types';

export const useCreatedCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatedCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      // Fetch communities created by the user
      const { data: createdCommunitiesData, error: createdError } = await supabase
        .from('communities')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Check which communities the user is also a member of
      const communityIds = (createdCommunitiesData || []).map(c => c.id);
      let membershipData: any[] = [];
      
      if (communityIds.length > 0) {
        const { data, error: membershipError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .in('community_id', communityIds);

        if (membershipError) throw membershipError;
        membershipData = data || [];
      }

      const memberCommunityIds = new Set(membershipData.map(m => m.community_id));

      // Format the data
      const formattedCommunities: Community[] = (createdCommunitiesData || []).map(community => ({
        id: community.id,
        name: community.name,
        members: community.member_count,
        description: community.description,
        tags: community.tags || [],
        recentActivity: 'today',
        isJoined: memberCommunityIds.has(community.id),
        createdBy: community.created_by,
        isCreatedByUser: true,
        isRecommended: false,
        is_public: community.is_public,
        restrict_messaging: community.restrict_messaging
      }));

      setCommunities(formattedCommunities);
    } catch (err) {
      console.error('Error fetching created communities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch created communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatedCommunities();
  }, []);

  const refreshCommunities = () => {
    fetchCreatedCommunities();
  };

  return {
    communities,
    loading,
    error,
    refreshCommunities
  };
};