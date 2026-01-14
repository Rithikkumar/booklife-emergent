import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface CommunityGrowth {
  weeklyNewMembers: number;
  weeklyMessages: number;
  growthTrend: 'up' | 'down' | 'stable';
}

export interface UserInteraction {
  type: 'view' | 'message' | 'join' | 'leave' | 'react';
  communityId: string;
  timestamp: Date;
}

/**
 * Hook to track community growth and user interactions
 */
export const useCommunityGrowth = (communityId?: string) => {
  const [growth, setGrowth] = useState<CommunityGrowth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeeklyGrowth = useCallback(async () => {
    if (!communityId) return;

    setLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoISO = oneWeekAgo.toISOString();

      // Get new members in the last week
      const { data: newMembers, error: membersError } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .gte('joined_at', oneWeekAgoISO);

      if (membersError) {
        logger.error('[CommunityGrowth] Error fetching new members:', membersError);
      }

      // Get messages in the last week
      const { data: recentMessages, error: messagesError } = await supabase
        .from('community_messages')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .gte('created_at', oneWeekAgoISO);

      if (messagesError) {
        logger.error('[CommunityGrowth] Error fetching messages:', messagesError);
      }

      const weeklyNewMembers = newMembers?.length || 0;
      const weeklyMessages = recentMessages?.length || 0;

      // Determine trend based on activity
      let growthTrend: 'up' | 'down' | 'stable' = 'stable';
      if (weeklyNewMembers > 2 || weeklyMessages > 10) {
        growthTrend = 'up';
      } else if (weeklyNewMembers === 0 && weeklyMessages < 3) {
        growthTrend = 'down';
      }

      setGrowth({
        weeklyNewMembers,
        weeklyMessages,
        growthTrend
      });

    } catch (error) {
      logger.error('[CommunityGrowth] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchWeeklyGrowth();
  }, [fetchWeeklyGrowth]);

  return {
    growth,
    loading,
    refetch: fetchWeeklyGrowth
  };
};

/**
 * Hook to track user interactions for analytics and recommendations
 */
export const useTrackInteraction = () => {
  const trackInteraction = useCallback(async (
    communityId: string,
    interactionType: 'view' | 'message' | 'join' | 'leave' | 'react' | 'search',
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert into user_community_interactions table
      const { error } = await supabase
        .from('user_community_interactions')
        .insert({
          user_id: user.id,
          community_id: communityId,
          interaction_type: interactionType,
          weight: getInteractionWeight(interactionType),
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        // Don't throw - interactions are non-critical
        logger.debug('[TrackInteraction] Could not track:', error.message);
      }
    } catch (error) {
      // Silently fail - tracking should not break the app
      logger.debug('[TrackInteraction] Error:', error);
    }
  }, []);

  return { trackInteraction };
};

/**
 * Get weight for different interaction types (used for recommendation scoring)
 */
function getInteractionWeight(type: string): number {
  switch (type) {
    case 'join': return 10;
    case 'message': return 5;
    case 'react': return 3;
    case 'view': return 1;
    case 'search': return 2;
    case 'leave': return -5;
    default: return 1;
  }
}

/**
 * Hook for generating client-side recommendations (fallback when Edge Function unavailable)
 */
export const useClientRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Array<{
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
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecommendations([]);
        return;
      }

      // Get user's current communities
      const { data: userCommunities } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      const userCommunityIds = new Set(userCommunities?.map(c => c.community_id) || []);

      // Get user's books for interest matching
      const { data: userBooks } = await supabase
        .from('user_books')
        .select('tags')
        .eq('user_id', user.id);

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

        // Category bonus for common categories
        if (community.category && ['Fiction', 'Non-Fiction', 'Education'].includes(community.category)) {
          score += 0.05;
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

      setRecommendations(topRecommendations);

      // Also save to database for caching
      if (topRecommendations.length > 0) {
        // Clear old recommendations
        await supabase
          .from('community_recommendations')
          .delete()
          .eq('user_id', user.id);

        // Insert new ones
        await supabase
          .from('community_recommendations')
          .insert(
            topRecommendations.map(rec => ({
              user_id: user.id,
              community_id: rec.community_id,
              score: rec.score,
              reason: rec.reason,
              algorithm_type: rec.algorithm_type,
              computed_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }))
          );
      }

    } catch (err) {
      logger.error('[ClientRecommendations] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Try to load cached recommendations first
  useEffect(() => {
    const loadCached = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: cached } = await supabase
          .from('community_recommendations')
          .select('community_id, score, reason, algorithm_type')
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
          .order('score', { ascending: false })
          .limit(10);

        if (cached && cached.length > 0) {
          // Fetch community details
          const communityIds = cached.map(r => r.community_id);
          const { data: communities } = await supabase
            .from('communities')
            .select('*')
            .in('id', communityIds);

          const communityMap = new Map(communities?.map(c => [c.id, c]) || []);

          setRecommendations(
            cached
              .filter(r => communityMap.has(r.community_id))
              .map(r => ({
                ...r,
                community: {
                  id: r.community_id,
                  name: communityMap.get(r.community_id)?.name || '',
                  description: communityMap.get(r.community_id)?.description || '',
                  member_count: communityMap.get(r.community_id)?.member_count || 0,
                  activity_score: communityMap.get(r.community_id)?.activity_score || 0,
                  tags: communityMap.get(r.community_id)?.tags || [],
                  category: communityMap.get(r.community_id)?.category || ''
                }
              }))
          );
        } else {
          // No cache, generate fresh
          generateRecommendations();
        }
      } catch {
        generateRecommendations();
      }
    };

    loadCached();
  }, [generateRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations: generateRecommendations
  };
};
