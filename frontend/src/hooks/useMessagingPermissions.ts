import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessagingPermissions = (communityId?: string) => {
  const [canSendMessages, setCanSendMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [restrictMessaging, setRestrictMessaging] = useState(false);

  useEffect(() => {
    const checkMessagingPermissions = async () => {
      if (!communityId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCanSendMessages(false);
          setLoading(false);
          return;
        }

        // Get community details and check if user is owner
        const { data: communityData } = await supabase
          .from('communities')
          .select('created_by, restrict_messaging')
          .eq('id', communityId)
          .single();

        if (!communityData) {
          setCanSendMessages(false);
          setLoading(false);
          return;
        }

        const userIsOwner = communityData.created_by === user.id;
        const messagingRestricted = communityData.restrict_messaging;
        
        setIsOwner(userIsOwner);
        setRestrictMessaging(messagingRestricted);

        // Check if user is admin
        const { data: memberData } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();

        const userIsAdmin = memberData?.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Determine if user can send messages
        if (!messagingRestricted) {
          // If messaging is not restricted, any member can send messages
          setCanSendMessages(!!memberData); // User must be a member
        } else {
          // If messaging is restricted, only owner and admins can send messages
          // Community creators always have messaging permissions regardless of member status
          setCanSendMessages(userIsOwner || userIsAdmin);
        }

      } catch (error) {
        console.error('Error checking messaging permissions:', error);
        setCanSendMessages(false);
      } finally {
        setLoading(false);
      }
    };

    checkMessagingPermissions();
  }, [communityId]);

  return {
    canSendMessages,
    loading,
    isOwner,
    isAdmin,
    restrictMessaging
  };
};