import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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

  // Client-side recommendation generation (fallback)
  const generateClientRecommendations = async (userId: string): Promise<void> => {
    logger.debug('[Recommendations] Using client-side generation');

    // Get user's current communities
    const { data: userCommunities } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    const userCommunityIds = new Set(userCommunities?.map(c => c.community_id) || []);

    // Get user's books for interest matching
    const { data: userBooks } = await supabase
      .from('user_books')
      .select('tags')
      .eq('user_id', userId);

    // Extract user's interests from book tags
    const userTags = new Set<string>();
    userBooks?.forEach(book => {
      if (book.tags && Array.isArray(book.tags)) {
        book.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
      }
    });

    // Get all public communities user hasn't joined
    const { data: allCommunities, error: commError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_public', true);

    if (commError) throw commError;

    const availableCommunities = allCommunities?.filter(c => !userCommunityIds.has(c.id)) || [];

    // Score and rank communities
    const scored = availableCommunities.map(community => {
      let score = 0;
      const reasons: string[] = [];
      const algorithms: string[] = [];

      // Tag matching (content-based)
      const communityTags = (community.tags || []).map((t: string) => t.toLowerCase());
      const matchedTags = communityTags.filter((tag: string) => userTags.has(tag));
      if (matchedTags.length > 0) {
        score += 0.3 * Math.min(matchedTags.length / 3, 1);
        reasons.push(`Matches your interests: ${matchedTags.slice(0, 2).join(', ')}`);
        algorithms.push('content_based');
      }

      // Popularity scoring
      const memberCount = community.member_count || 0;
      if (memberCount >= 10 && memberCount <= 1000) {
        score += 0.1;
        if (memberCount >= 50) {
          reasons.push('Active community');
          algorithms.push('popularity');
        }
      }

      // Activity scoring
      const activityScore = community.activity_score || 0;
      if (activityScore >= 50) {
        score += 0.15;
        algorithms.push('activity');
      }

      // Category bonus
      if (community.category && ['Fiction', 'Non-Fiction', 'Education'].includes(community.category)) {
        score += 0.05;
      }

      // Give small boost to any community if user has no strong matches
      if (score === 0 && memberCount >= 5) {
        score = 0.1;
        reasons.push('Popular in your area');
        algorithms.push('trending');
      }

      return {
        community_id: community.id,
        score: Math.round(score * 1000) / 1000,
        reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
        algorithm_type: algorithms.join(',') || 'default',
        community: {
          id: community.id,
          name: community.name,
          description: community.description || '',
          member_count: community.member_count || 0,
          activity_score: community.activity_score || 0,
          tags: community.tags || [],
          category: community.category || ''
        }
      };
    });

    // Sort by score and take top 10
    const topRecommendations = scored
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Save to database for caching
    if (topRecommendations.length > 0) {
      // Clear old recommendations
      await supabase
        .from('community_recommendations')
        .delete()
        .eq('user_id', userId);

      // Insert new ones
      await supabase
        .from('community_recommendations')
        .insert(
          topRecommendations.map(rec => ({
            user_id: userId,
            community_id: rec.community_id,
            score: rec.score,
            reason: rec.reason,
            algorithm_type: rec.algorithm_type,
            computed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }))
        );
    }

    setRecommendations(topRecommendations);
  };

  const generateRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      logger.debug('[Recommendations] Attempting Edge Function...');
      
      // Try Edge Function first
      const session = await supabase.auth.getSession();
      const { error: genError } = await supabase.functions.invoke('generate-community-recommendations', {
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`
        }
      });

      if (genError) {
        logger.debug('[Recommendations] Edge Function failed, using client-side:', genError.message);
        // Fallback to client-side generation
        await generateClientRecommendations(user.id);
      } else {
        logger.debug('[Recommendations] Edge Function succeeded');
      }
    } catch (err) {
      logger.error('[Recommendations] Error in generateRecommendations:', err);
      // Try client-side as last resort
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await generateClientRecommendations(user.id);
      }
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
        logger.debug('[Recommendations] No cached recommendations, generating...');
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
      logger.error('[Recommendations] Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('[Recommendations] Refreshing...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clear existing and regenerate
      await supabase
        .from('community_recommendations')
        .delete()
        .eq('user_id', user.id);

      await generateRecommendations();
      await fetchRecommendations();
    } catch (err) {
      logger.error('[Recommendations] Error refreshing:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh recommendations');
    } finally {
      setLoading(false);
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
