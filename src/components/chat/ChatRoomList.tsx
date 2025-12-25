import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Search, Users, Plus, MessageSquarePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  // Computed
  display_name?: string;
  display_avatar?: string;
  unread_count?: number;
  other_member?: {
    user_id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
  };
}

interface ChatRoomListProps {
  selectedRoomId?: string;
  onSelectRoom: (roomId: string, roomType: 'direct' | 'group') => void;
  onNewChat?: () => void;
  onNewGroup?: () => void;
  className?: string;
}

export const ChatRoomList: React.FC<ChatRoomListProps> = ({
  selectedRoomId,
  onSelectRoom,
  onNewChat,
  onNewGroup,
  className
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get all rooms the user is a member of
      const { data: membershipData, error: membershipError } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = membershipData.map(m => m.room_id);

      // Fetch room details
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (roomsError) throw roomsError;

      // For direct chats, fetch the other participant's profile
      const directRooms = (roomsData || []).filter(r => r.type === 'direct');
      
      if (directRooms.length > 0) {
        // Get all members of direct rooms
        const { data: allMembers } = await supabase
          .from('chat_room_members')
          .select('room_id, user_id')
          .in('room_id', directRooms.map(r => r.id));

        // Get other user IDs
        const otherUserIds = [...new Set(
          (allMembers || [])
            .filter(m => m.user_id !== user.id)
            .map(m => m.user_id)
        )];

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, profile_picture_url')
          .in('user_id', otherUserIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
        const memberRoomMap = new Map<string, string>();
        (allMembers || []).forEach(m => {
          if (m.user_id !== user.id) {
            memberRoomMap.set(m.room_id, m.user_id);
          }
        });

        // Enhance rooms with profile data
        const enhancedRooms = (roomsData || []).map(room => {
          if (room.type === 'direct') {
            const otherUserId = memberRoomMap.get(room.id);
            const profile = otherUserId ? profileMap.get(otherUserId) : undefined;
            return {
              ...room,
              display_name: profile?.display_name || profile?.username || 'Unknown',
              display_avatar: profile?.profile_picture_url,
              other_member: profile ? {
                user_id: otherUserId!,
                username: profile.username,
                display_name: profile.display_name,
                profile_picture_url: profile.profile_picture_url
              } : undefined
            } as ChatRoom;
          }
          return {
            ...room,
            display_name: room.name || 'Group Chat',
            display_avatar: room.avatar_url
          } as ChatRoom;
        });

        setRooms(enhancedRooms);
      } else {
        setRooms((roomsData || []).map(room => ({
          ...room,
          display_name: room.name || 'Group Chat',
          display_avatar: room.avatar_url
        })) as ChatRoom[]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    // Subscribe to room updates
    const channel = supabase
      .channel('chat_rooms_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      room.display_name?.toLowerCase().includes(searchLower) ||
      room.last_message_preview?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex gap-1">
            {onNewChat && (
              <Button variant="ghost" size="icon" onClick={onNewChat} title="New chat">
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            )}
            {onNewGroup && (
              <Button variant="ghost" size="icon" onClick={onNewGroup} title="New group">
                <Plus className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Room list */}
      <ScrollArea className="flex-1">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new conversation to connect with others
            </p>
            {onNewChat && (
              <Button onClick={onNewChat} size="sm">
                Start a chat
              </Button>
            )}
          </div>
        ) : (
          <div className="px-2">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id, room.type)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                  'hover:bg-muted/50',
                  selectedRoomId === room.id && 'bg-muted'
                )}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={room.display_avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {room.type === 'group' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getInitials(room.display_name)
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{room.display_name}</span>
                    {room.last_message_at && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(room.last_message_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {room.last_message_preview && (
                    <p className="text-sm text-muted-foreground truncate">
                      {room.last_message_preview}
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {room.unread_count && room.unread_count > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
