import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserActivity {
  communitiesJoined: number;
  messagesSent: number;
  booksShared: number;
}

export const useUserActivity = () => {
  const [activity, setActivity] = useState<UserActivity>({
    communitiesJoined: 0,
    messagesSent: 0,
    booksShared: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setActivity({ communitiesJoined: 0, messagesSent: 0, booksShared: 0 });
          setLoading(false);
          return;
        }

        // Get communities joined count
        const { count: communitiesCount, error: communitiesError } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (communitiesError) throw communitiesError;

        // Get messages sent count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('community_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (messagesError) throw messagesError;

        // Get books shared count
        const { count: booksCount, error: booksError } = await supabase
          .from('user_books')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (booksError) throw booksError;

        setActivity({
          communitiesJoined: communitiesCount || 0,
          messagesSent: messagesCount || 0,
          booksShared: booksCount || 0
        });
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user activity');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, []);

  return { activity, loading, error };
};