import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  user_profile?: {
    username: string;
    display_name?: string;
    profile_picture_url?: string;
  };
}

export const useCommunityJoinRequests = (communityId?: string) => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userJoinRequest, setUserJoinRequest] = useState<JoinRequest | null>(null);
  const { toast } = useToast();

  const fetchJoinRequests = async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch join requests for community (admin view)
      const { data: requests, error: requestsError } = await supabase
        .from('community_join_requests')
        .select(`
          id,
          community_id,
          user_id,
          status,
          message,
          created_at,
          updated_at,
          reviewed_by,
          reviewed_at
        `)
        .eq('community_id', communityId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch user profiles separately to avoid relation issues
      const requestsWithProfiles = [];
      if (requests && requests.length > 0) {
        const userIds = requests.map(req => req.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, profile_picture_url')
          .in('user_id', userIds);

        for (const request of requests) {
          const userProfile = profiles?.find(p => p.user_id === request.user_id);
          requestsWithProfiles.push({
            ...request,
            user_profile: userProfile ? {
              username: userProfile.username,
              display_name: userProfile.display_name,
              profile_picture_url: userProfile.profile_picture_url
            } : undefined
          } as JoinRequest);
        }
      }

      setJoinRequests(requestsWithProfiles);

      // Check if current user has a join request for this community
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRequest, error: userRequestError } = await supabase
          .from('community_join_requests')
          .select('*')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userRequestError) throw userRequestError;
        setUserJoinRequest(userRequest as JoinRequest | null);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch join requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendJoinRequest = async (message?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !communityId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('community_join_requests')
        .insert({
          community_id: communityId,
          user_id: user.id,
          message: message || null
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your join request has been sent to the community admin"
      });

      await fetchJoinRequests();
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "You already have a pending request for this community"
          : "Failed to send join request",
        variant: "destructive"
      });
    }
  };

  const cancelJoinRequest = async () => {
    if (!userJoinRequest) return;

    try {
      const { error } = await supabase
        .from('community_join_requests')
        .delete()
        .eq('id', userJoinRequest.id);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your join request has been cancelled"
      });

      setUserJoinRequest(null);
    } catch (error: any) {
      console.error('Error cancelling join request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel join request",
        variant: "destructive"
      });
    }
  };

  const approveJoinRequest = async (requestId: string, approve: boolean = true) => {
    try {
      const { error } = await supabase.rpc('approve_join_request', {
        p_request_id: requestId,
        p_approve: approve
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Join request ${approve ? 'approved' : 'rejected'}`
      });

      await fetchJoinRequests();
    } catch (error: any) {
      console.error('Error processing join request:', error);
      toast({
        title: "Error",
        description: "Failed to process join request",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, [communityId]);

  return {
    joinRequests,
    userJoinRequest,
    loading,
    sendJoinRequest,
    cancelJoinRequest,
    approveJoinRequest,
    refreshJoinRequests: fetchJoinRequests
  };
};