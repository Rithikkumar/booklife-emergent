import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCommunityAdmin = (communityId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!communityId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is community admin using the database function
        const { data, error } = await supabase
          .rpc('is_community_admin', {
            p_user_id: user.id,
            p_community_id: communityId
          });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [communityId]);

  const updateCommunity = async (updates: {
    name?: string;
    description?: string;
    tags?: string[];
    profile_picture_url?: string;
  }) => {
    if (!communityId || !isAdmin) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', communityId);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Community updated successfully"
    });
  };

  const promoteMember = async (userId: string, newRole: 'admin' | 'moderator' = 'admin') => {
    if (!communityId || !isAdmin) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('community_members')
      .update({ role: newRole })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;

    toast({
      title: "Success",
      description: `Member promoted to ${newRole}`
    });
  };

  const removeMember = async (userId: string) => {
    if (!communityId || !isAdmin) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Member removed successfully"
    });
  };

  const demoteMember = async (userId: string) => {
    if (!communityId || !isAdmin) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('community_members')
      .update({ role: 'member' })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Member demoted to regular member"
    });
  };

  return {
    isAdmin,
    loading,
    updateCommunity,
    promoteMember,
    removeMember,
    demoteMember
  };
};