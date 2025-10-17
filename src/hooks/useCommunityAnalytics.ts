import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateActivityLevel } from '@/utils/activityHelpers';

export interface CommunityAnalytics {
  memberCount: number;
  messageCount: number;
  lastActivity?: string;
  activeMembersCount: number;
  recentMessagesCount: number;
  activityLevel: 'Very High' | 'High' | 'Moderate' | 'Low';
  activityColor: string;
  activityDescription: string;
}

export const useCommunityAnalytics = (communityId?: string) => {
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!communityId) return;

    setLoading(true);
    console.log('Fetching analytics for community:', communityId);
    
    try {
      // Use the new analytics function for consistent data
      const { data, error } = await supabase
        .rpc('get_community_analytics', { p_community_id: communityId });

      console.log('Analytics RPC result:', { data, error });

      if (error) {
        console.error('Analytics RPC error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const analyticsData = data[0];
        const activityInfo = calculateActivityLevel(
          Number(analyticsData.message_count), 
          Number(analyticsData.member_count)
        );

        setAnalytics({
          memberCount: Number(analyticsData.member_count),
          messageCount: Number(analyticsData.message_count),
          lastActivity: analyticsData.last_activity,
          activeMembersCount: Number(analyticsData.active_members_count),
          recentMessagesCount: Number(analyticsData.recent_messages_count),
          activityLevel: activityInfo.level,
          activityColor: activityInfo.color,
          activityDescription: activityInfo.description,
        });
      } else {
        // No data found, set default values
        const activityInfo = calculateActivityLevel(0, 0);
        setAnalytics({
          memberCount: 0,
          messageCount: 0,
          lastActivity: undefined,
          activeMembersCount: 0,
          recentMessagesCount: 0,
          activityLevel: activityInfo.level,
          activityColor: activityInfo.color,
          activityDescription: activityInfo.description,
        });
      }
    } catch (error) {
      console.error('Error fetching community analytics:', error);
      // Set default values on error
      const activityInfo = calculateActivityLevel(0, 0);
      setAnalytics({
        memberCount: 0,
        messageCount: 0,
        lastActivity: undefined,
        activeMembersCount: 0,
        recentMessagesCount: 0,
        activityLevel: activityInfo.level,
        activityColor: activityInfo.color,
        activityDescription: activityInfo.description,
      });
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    refreshAnalytics: fetchAnalytics,
  };
};