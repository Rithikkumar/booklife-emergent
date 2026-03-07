import { useState, useEffect, useCallback } from 'react';
import { MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MessagesDropdown = () => {
  const { isAuthenticated, isLoading, userId } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      // Get rooms user is a member of
      const { data: memberships } = await supabase
        .from('chat_room_members')
        .select('room_id, last_read_at')
        .eq('user_id', userId);

      if (!memberships || memberships.length === 0) {
        setTotalUnread(0);
        return;
      }

      // Count unread messages across all rooms
      let unread = 0;
      for (const membership of memberships) {
        if (membership.last_read_at) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', membership.room_id)
            .neq('sender_id', userId)
            .gt('created_at', membership.last_read_at);
          unread += count || 0;
        }
      }
      setTotalUnread(unread);
    } catch {
      // Silently fail - unread count is non-critical
    }
  }, [userId]);

  useEffect(() => {
    fetchUnreadCount();

    // Re-check on new messages
    const channel = supabase
      .channel('unread_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUnreadCount]);

  return (
    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
      {isLoading ? (
        <div className="w-9 h-9 rounded-md bg-muted/50 animate-pulse" />
      ) : isAuthenticated ? (
        <Link to="/messages">
          <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 hover:bg-accent">
            <MessagesSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </Badge>
            )}
          </Button>
        </Link>
      ) : (
        <div className="w-9 h-9" aria-hidden="true" />
      )}
    </div>
  );
};

export default MessagesDropdown;