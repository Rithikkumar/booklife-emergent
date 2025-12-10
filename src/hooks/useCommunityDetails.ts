import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Community } from '@/types';
import { useCommunityAnalytics } from './useCommunityAnalytics';

export interface CommunityDetails extends Community {
  messageCount: number;
  lastActivity?: string;
  isUserMember: boolean;
  userRole?: string;
  isMember: boolean;
  is_public: boolean;
  restrict_messaging: boolean;
}

export const useCommunityDetails = (communityId?: string) => {
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const { toast } = useToast();
  const { analytics, refreshAnalytics } = useCommunityAnalytics(communityId);

  const fetchCommunityDetails = useCallback(async (forceUpdate = false) => {
    if (!communityId) return;

    // If we already have community data and aren't forcing update, just refresh membership
    if (!forceUpdate && community && !loading) {
      await refreshMembershipStatus();
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Fetching community details for user:', user?.id);

      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*, guidelines')
        .eq('id', communityId)
        .single();

      if (communityError) throw communityError;

      // Check if user is a member and get their role
      let isUserMember = false;
      let userRole: string | undefined;
      let currentJoinRequestStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';

      if (user) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();

        isUserMember = !!memberData;
        userRole = memberData?.role;

        console.log('Membership check result:', { 
          isUserMember, 
          userRole, 
          memberData,
          userId: user.id,
          communityId 
        });

        // If not a member, check for join request status
        if (!isUserMember) {
          const { data: joinRequestData } = await supabase
            .from('community_join_requests')
            .select('status')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          currentJoinRequestStatus = (joinRequestData?.status as 'pending' | 'approved' | 'rejected') || 'none';
        }
      }

      setJoinRequestStatus(currentJoinRequestStatus);

      // Get message count and latest activity from analytics (fallback to basic counts if not available)
      const memberCount = analytics?.memberCount || communityData.member_count || 0;
      const messageCount = analytics?.messageCount || 0;
      const lastActivity = analytics?.lastActivity;

      const newCommunity = {
        id: communityData.id,
        name: communityData.name,
        description: communityData.description,
        members: memberCount,
        tags: communityData.tags || [],
        recentActivity: lastActivity ? new Date(lastActivity).toLocaleDateString() : 'No recent activity',
        isJoined: isUserMember,
        createdBy: communityData.created_by,
        isCreatedByUser: user?.id === communityData.created_by,
        isRecommended: false,
        messageCount,
        lastActivity,
        isUserMember,
        userRole,
        isMember: isUserMember,
        is_public: communityData.is_public,
        restrict_messaging: communityData.restrict_messaging || false,
        guidelines: communityData.guidelines,
      };

      console.log('Setting community data:', { 
        isUserMember: newCommunity.isUserMember,
        isMember: newCommunity.isMember,
        isJoined: newCommunity.isJoined 
      });

      setCommunity(newCommunity);

    } catch (error) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [communityId, toast, analytics]);

  const refreshMembershipStatus = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Refreshing membership status for user:', user?.id);
      
      if (!user) return;

      // Check current membership status
      const { data: memberData } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      const isUserMember = !!memberData;
      const userRole = memberData?.role;

      console.log('Membership refresh result:', { 
        isUserMember, 
        userRole, 
        memberData,
        userId: user.id,
        communityId 
      });

      // Update community state with new membership info
      setCommunity(prev => {
        if (!prev) return null;
        
        const updated = {
          ...prev,
          isUserMember,
          userRole,
          isMember: isUserMember,
          isJoined: isUserMember,
        };

        console.log('Updated community membership state:', {
          isUserMember: updated.isUserMember,
          isMember: updated.isMember,
          isJoined: updated.isJoined
        });

        return updated;
      });

      // Update join request status if not a member
      if (!isUserMember) {
        const { data: joinRequestData } = await supabase
          .from('community_join_requests')
          .select('status')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setJoinRequestStatus((joinRequestData?.status as 'pending' | 'approved' | 'rejected') || 'none');
      } else {
        setJoinRequestStatus('approved');
      }

    } catch (error) {
      console.error('Error refreshing membership status:', error);
    }
  }, [communityId]);

  const joinCommunity = useCallback(async () => {
    if (!communityId || !community) return;

    // If user is already a member, show leave dialog
    if (community.isMember) {
      setShowLeaveDialog(true);
      return;
    }

    // If community is private and user hasn't sent a request, redirect to join request flow
    if (!community.is_public && joinRequestStatus === 'none') {
      // This will be handled by the UI component to show join request dialog
      return;
    }

    // For public communities, join directly
    if (community.is_public) {
      setJoining(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to join communities",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: user.id,
            role: 'member'
          });

        if (error) {
          console.error('Error joining community:', error);
          if (error.code === '23505') {
            toast({
              title: "Already Joined",
              description: `You're already a member of ${community.name}!`,
            });
          } else {
            throw new Error(`Failed to join community: ${error.message}`);
          }
        } else {
          toast({
            title: "Joined Community",
            description: `Welcome to ${community.name}!`,
          });
        }

        // Refresh community details and analytics immediately
        await Promise.all([
          refreshMembershipStatus(),
          refreshAnalytics()
        ]);
        
        // Also do a full refresh to ensure everything is in sync
        setTimeout(() => {
          fetchCommunityDetails(true);
        }, 100);
      } catch (error) {
        console.error('Error joining community:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setJoining(false);
      }
    }
  }, [communityId, community, joinRequestStatus, fetchCommunityDetails, refreshAnalytics, toast]);

  const confirmLeaveCommunity = useCallback(async () => {
    if (!communityId || !community) return;

    setJoining(true);
    setShowLeaveDialog(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to leave communities",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        throw new Error(`Failed to leave community: ${error.message}`);
      }

      toast({
        title: "Left Community",
        description: `You've left ${community.name}`,
      });

      // Refresh community details and analytics immediately
      await Promise.all([
        refreshMembershipStatus(),
        refreshAnalytics()
      ]);
      
      // Also do a full refresh to ensure everything is in sync
      setTimeout(() => {
        fetchCommunityDetails(true);
      }, 100);
    } catch (error) {
      console.error('Error leaving community:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  }, [communityId, community, fetchCommunityDetails, toast]);

  // Initial load and setup real-time subscriptions
  useEffect(() => {
    if (!communityId) return;

    // Load community details immediately
    fetchCommunityDetails(true);

    // Set up real-time subscription for membership changes
    const membershipChannel = supabase
      .channel(`community-membership-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          console.log('Membership change detected:', payload);
          // Refresh membership status when changes occur
          await refreshMembershipStatus();
          
          // Also refresh analytics to get updated member count
          refreshAnalytics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_join_requests',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          console.log('Join request change detected:', payload);
          await refreshMembershipStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membershipChannel);
    };
  }, [communityId, fetchCommunityDetails, refreshMembershipStatus, refreshAnalytics]);

  // Update community data when analytics change (but don't wait for them to load initially)
  useEffect(() => {
    if (analytics && community) {
      setCommunity(prev => prev ? {
        ...prev,
        members: analytics.memberCount || prev.members,
        messageCount: analytics.messageCount || prev.messageCount,
        lastActivity: analytics.lastActivity || prev.lastActivity,
        recentActivity: analytics.lastActivity ? new Date(analytics.lastActivity).toLocaleDateString() : prev.recentActivity,
      } : null);
    }
  }, [analytics, community]);

  return {
    community,
    loading,
    joining,
    joinCommunity,
    confirmLeaveCommunity,
    showLeaveDialog,
    setShowLeaveDialog,
    joinRequestStatus,
    refreshCommunity: fetchCommunityDetails,
    refreshMembershipStatus,
  };
};