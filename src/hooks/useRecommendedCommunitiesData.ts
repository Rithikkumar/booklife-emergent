import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types';

export const useRecommendedCommunitiesData = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Generating fresh recommendations...');
      
      // Call the edge function to generate recommendations
      const { error: genError } = await supabase.functions.invoke('generate-community-recommendations', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (genError) {
        console.error('Error generating recommendations:', genError);
      } else {
        console.log('Recommendations generated successfully');
      }
    } catch (err) {
      console.error('Error in generateRecommendations:', err);
    }
  };

  const fetchRecommendedCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      // First try to get existing recommendations
      const { data: recommendationsData, error: recommendationsError } = await supabase
        .from('community_recommendations')
        .select('community_id, score, reason, algorithm_type')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('score', { ascending: false })
        .limit(10);

      if (recommendationsError) throw recommendationsError;

      // If no recommendations exist or they're expired, generate new ones
      if (!recommendationsData || recommendationsData.length === 0) {
        console.log('No existing recommendations found, generating new ones...');
        await generateRecommendations();
        
        // Fetch the newly generated recommendations
        const { data: newRecommendationsData, error: newRecommendationsError } = await supabase
          .from('community_recommendations')
          .select('community_id, score, reason, algorithm_type')
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
          .order('score', { ascending: false })
          .limit(10);

        if (newRecommendationsError) throw newRecommendationsError;
        
        if (!newRecommendationsData || newRecommendationsData.length === 0) {
          setCommunities([]);
          return;
        }
        
        // Use the newly generated recommendations
        const communityIds = newRecommendationsData.map(r => r.community_id);
        await fetchCommunitiesData(newRecommendationsData, communityIds, user.id);
      } else {
        // Use existing recommendations
        const communityIds = recommendationsData.map(r => r.community_id);
        await fetchCommunitiesData(recommendationsData, communityIds, user.id);
      }
    } catch (err) {
      console.error('Error fetching recommended communities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommended communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunitiesData = async (recommendationsData: any[], communityIds: string[], userId: string) => {
    // Fetch the actual community details
    const { data: communitiesData, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .in('id', communityIds);

    if (communitiesError) throw communitiesError;

    // Check membership status for recommended communities
    const { data: membershipData, error: membershipError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)
      .in('community_id', communityIds);

    if (membershipError) throw membershipError;

    const memberCommunityIds = new Set((membershipData || []).map(m => m.community_id));

    // Create a map of recommendations for easy lookup
    const recMap = new Map();
    recommendationsData.forEach(rec => {
      recMap.set(rec.community_id, rec);
    });

    // Format the data and sort by recommendation score
    const formattedCommunities: Community[] = (communitiesData || [])
      .map(community => {
        const rec = recMap.get(community.id);
        return {
          id: community.id,
          name: community.name,
          members: community.member_count,
          description: community.description,
          tags: community.tags || [],
          recentActivity: 'today',
          isJoined: memberCommunityIds.has(community.id),
          createdBy: community.created_by,
          isCreatedByUser: userId === community.created_by,
          isRecommended: true,
          recommendationScore: rec?.score || 0,
          recommendationReason: rec?.reason || 'Recommended for you',
          is_public: community.is_public,
          restrict_messaging: community.restrict_messaging
        };
      })
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));

    setCommunities(formattedCommunities);
  };

  useEffect(() => {
    fetchRecommendedCommunities();
  }, []);

  const refreshCommunities = async () => {
    console.log('Refreshing recommendations...');
    // Force generate new recommendations
    await generateRecommendations();
    // Then fetch the updated data
    await fetchRecommendedCommunities();
  };

  return {
    communities,
    loading,
    error,
    refreshCommunities,
    generateRecommendations
  };
};