import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityOfTheWeek {
  id: string;
  name: string;
  description: string;
  messageCount: number;
}

export const useCommunityOfTheWeek = () => {
  const [community, setCommunity] = useState<CommunityOfTheWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityOfTheWeek = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the most active community based on recent messages (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: messageStats, error: messagesError } = await supabase
          .from('community_messages')
          .select('community_id')
          .gte('created_at', oneWeekAgo.toISOString());

        if (messagesError) throw messagesError;

        // Count messages per community
        const communityMessageCounts: Record<string, number> = {};
        messageStats?.forEach(msg => {
          communityMessageCounts[msg.community_id] = (communityMessageCounts[msg.community_id] || 0) + 1;
        });

        // Find the community with most messages
        const topCommunityId = Object.entries(communityMessageCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        if (!topCommunityId) {
          // Fallback to community with most members if no recent messages
          const { data: fallbackCommunity, error: fallbackError } = await supabase
            .from('communities')
            .select('id, name, description, member_count')
            .eq('is_public', true)
            .order('member_count', { ascending: false })
            .limit(1)
            .single();

          if (fallbackError) throw fallbackError;
          
          if (fallbackCommunity) {
            setCommunity({
              id: fallbackCommunity.id,
              name: fallbackCommunity.name,
              description: fallbackCommunity.description,
              messageCount: 0
            });
          }
          return;
        }

        // Get the community details
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('id, name, description')
          .eq('id', topCommunityId)
          .eq('is_public', true)
          .single();

        if (communityError) throw communityError;

        if (communityData) {
          setCommunity({
            id: communityData.id,
            name: communityData.name,
            description: communityData.description,
            messageCount: communityMessageCounts[topCommunityId]
          });
        }
      } catch (err) {
        console.error('Error fetching community of the week:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch community of the week');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityOfTheWeek();
  }, []);

  return { community, loading, error };
};