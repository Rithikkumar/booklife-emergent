import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types';
import { logger } from '@/utils/logger';

export const useAllCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all public communities AND user's own/joined private communities
      let communitiesData: any[] = [];
      if (user) {
        // Get community IDs the user is a member of (to include private ones)
        const { data: membershipIds } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);
        
        const memberCommunityIdList = (membershipIds || []).map(m => m.community_id);
        
        // Fetch public communities, user's own, and communities user is a member of
        let query = supabase
          .from('communities')
          .select('*')
          .order('activity_score', { ascending: false });
        
        if (memberCommunityIdList.length > 0) {
          query = query.or(`is_public.eq.true,created_by.eq.${user.id},id.in.(${memberCommunityIdList.join(',')})`);
        } else {
          query = query.or(`is_public.eq.true,created_by.eq.${user.id}`);
        }
        
        const { data, error: communitiesError } = await query;
          
        if (communitiesError) throw communitiesError;
        communitiesData = data || [];
      } else {
        // If not authenticated, only fetch public communities
        const { data, error: communitiesError } = await supabase
          .from('communities')
          .select('*')
          .eq('is_public', true)
          .order('activity_score', { ascending: false });
          
        if (communitiesError) throw communitiesError;
        communitiesData = data || [];
      }

      let membershipData: any[] = [];
      if (user) {
        // Fetch user's memberships
        const { data, error: membershipError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;
        membershipData = data || [];
      }

      const memberCommunityIds = new Set(membershipData.map(m => m.community_id));

      // Format communities with membership status
      const formattedCommunities: Community[] = (communitiesData || []).map(community => ({
        id: community.id,
        name: community.name,
        members: community.member_count,
        description: community.description,
        tags: community.tags || [],
        recentActivity: community.updated_at ? new Date(community.updated_at).toLocaleDateString() : 'No activity',
        isJoined: memberCommunityIds.has(community.id),
        createdBy: community.created_by,
        isCreatedByUser: user?.id === community.created_by,
        isRecommended: false, // This will be handled by recommendations hook
        is_public: community.is_public,
        restrict_messaging: community.restrict_messaging
      }));

      setCommunities(formattedCommunities);
    } catch (err) {
      logger.error('Error fetching communities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCommunities();
  }, []);

  const refreshCommunities = () => {
    fetchAllCommunities();
  };

  return {
    communities,
    loading,
    error,
    refreshCommunities
  };
};