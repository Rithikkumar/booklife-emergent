import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityRecommendation {
  community_id: string;
  score: number;
  reason: string;
  algorithm_type: string;
  community: {
    id: string;
    name: string;
    description: string;
    member_count: number;
    activity_score: number;
    tags: string[];
    category: string;
  };
}

interface UseRecommendationsResult {
  recommendations: CommunityRecommendation[];
  loading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
}

export const useCommunityRecommendations = (): UseRecommendationsResult => {
  const [recommendations, setRecommendations] = useState<CommunityRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
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
        throw genError;
      } else {
        console.log('Recommendations generated successfully');
      }
    } catch (err) {
      console.error('Error in generateRecommendations:', err);
      throw err;
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecommendations([]);
        return;
      }

      // First try to get existing recommendations
      let { data: recommendationsData, error: recommendationsError } = await supabase
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
        recommendationsData = newRecommendationsData || [];
      }

      if (!recommendationsData || recommendationsData.length === 0) {
        setRecommendations([]);
        return;
      }

      // Fetch the actual community details
      const communityIds = recommendationsData.map(r => r.community_id);
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name, description, member_count, activity_score, tags, category')
        .in('id', communityIds);

      if (communitiesError) throw communitiesError;

      // Create a map of communities for easy lookup
      const communityMap = new Map();
      (communitiesData || []).forEach(community => {
        communityMap.set(community.id, community);
      });

      // Combine recommendation data with community details
      const combinedRecommendations: CommunityRecommendation[] = recommendationsData
        .filter(rec => communityMap.has(rec.community_id))
        .map(rec => ({
          ...rec,
          community: communityMap.get(rec.community_id)
        }))
        .sort((a, b) => b.score - a.score);

      setRecommendations(combinedRecommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = useCallback(async () => {
    try {
      console.log('Refreshing recommendations...');
      // Force generate new recommendations
      await generateRecommendations();
      // Then fetch the updated data
      await fetchRecommendations();
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh recommendations');
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations
  };
};
