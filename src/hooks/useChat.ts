import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'system';
  reply_to_id: string | null;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
  };
  reply_to?: {
    id: string;
    message: string;
    sender_id: string;
    sender_name?: string;
  };
  // Optimistic UI flag
  isTemp?: boolean;
  isFailed?: boolean;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  profile?: {
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
  };
}

export interface TypingUser {
  user_id: string;
  username: string;
  display_name?: string;
}

interface UseChatOptions {
  roomId: string;
  pageSize?: number;
}

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 messages per minute

// Cache key prefix
const CACHE_PREFIX = 'chat_messages_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useChat = ({ roomId, pageSize = 50 }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Rate limiting state
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const { toast } = useToast();

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    getCurrentUser();
  }, []);

  // Check rate limit
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const recentMessages = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    
    if (recentMessages.length >= RATE_LIMIT_MAX) {
      const oldestMessage = Math.min(...recentMessages);
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestMessage)) / 1000);
      setIsRateLimited(true);
      setRetryAfter(waitTime);
      return false;
    }
    
    setIsRateLimited(false);
    setRetryAfter(0);
    return true;
  }, [messageTimestamps]);

  // Update rate limit countdown
  useEffect(() => {
    if (retryAfter > 0) {
      const interval = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [retryAfter]);

  // Cache helpers
  const getCachedMessages = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(`${CACHE_PREFIX}${roomId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data as ChatMessage[];
        }
        sessionStorage.removeItem(`${CACHE_PREFIX}${roomId}`);
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }, [roomId]);

  const setCachedMessages = useCallback((msgs: ChatMessage[]) => {
    try {
      sessionStorage.setItem(`${CACHE_PREFIX}${roomId}`, JSON.stringify({
        data: msgs.slice(0, 100), // Only cache last 100 messages
        timestamp: Date.now()
      }));
    } catch {
      // Ignore cache errors
    }
  }, [roomId]);

  // Fetch messages with profile data
  const fetchMessages = useCallback(async (offset = 0, append = false) => {
    if (!roomId) return;
    
    try {
      // Try cache for initial load
      if (offset === 0 && !append) {
        const cached = getCachedMessages();
        if (cached && cached.length > 0) {
          setMessages(cached);
          setLoading(false);
        }
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(
            user_id,
            username,
            display_name,
            profile_picture_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        // If the foreign key join fails, fetch without it
        const { data: basicData, error: basicError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (basicError) throw basicError;

        // Fetch profiles separately
        if (basicData && basicData.length > 0) {
          const senderIds = [...new Set(basicData.map(m => m.sender_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, profile_picture_url')
            .in('user_id', senderIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
          
          const messagesWithProfiles = basicData.map(msg => ({
            ...msg,
            sender: profileMap.get(msg.sender_id) ? {
              id: msg.sender_id,
              username: profileMap.get(msg.sender_id)!.username,
              display_name: profileMap.get(msg.sender_id)!.display_name,
              profile_picture_url: profileMap.get(msg.sender_id)!.profile_picture_url
            } : undefined
          })) as ChatMessage[];

          const reversedMessages = messagesWithProfiles.reverse();
          
          if (append) {
            setMessages(prev => [...reversedMessages, ...prev]);
          } else {
            setMessages(reversedMessages);
            setCachedMessages(reversedMessages);
          }
          
          setHasMore(basicData.length === pageSize);
        }
      } else if (data) {
        const messagesWithProfiles = data.map(msg => ({
          ...msg,
          sender: msg.sender ? {
            id: msg.sender_id,
            ...(msg.sender as any)
          } : undefined
        })) as ChatMessage[];

        const reversedMessages = messagesWithProfiles.reverse();
        
        if (append) {
          setMessages(prev => [...reversedMessages, ...prev]);
        } else {
          setMessages(reversedMessages);
          setCachedMessages(reversedMessages);
        }
        
        setHasMore(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, pageSize, getCachedMessages, setCachedMessages, toast]);

  // Fetch room members
  const fetchMembers = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profiles for members
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, profile_picture_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
        
        const membersWithProfiles = data.map(member => ({
          ...member,
          profile: profileMap.get(member.user_id)
        })) as ChatRoomMember[];

        setMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [roomId]);

  // Send message with optimistic UI
  const sendMessage = useCallback(async (
    message: string,
    replyToId?: string
  ): Promise<boolean> => {
    if (!currentUserId || !roomId || !message.trim()) return false;
    if (!checkRateLimit()) {
      toast({
        title: "Slow down",
        description: `Please wait ${retryAfter} seconds before sending another message`,
        variant: "destructive"
      });
      return false;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create optimistic message
    const tempMessage: ChatMessage = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUserId,
      message: message.trim(),
      message_type: 'text',
      reply_to_id: replyToId ?? null,
      reactions: {},
      is_edited: false,
      edited_at: null,
      created_at: now,
      updated_at: now,
      isTemp: true,
      sender: members.find(m => m.user_id === currentUserId)?.profile ? {
        id: currentUserId,
        username: members.find(m => m.user_id === currentUserId)!.profile!.username,
        display_name: members.find(m => m.user_id === currentUserId)!.profile!.display_name,
        profile_picture_url: members.find(m => m.user_id === currentUserId)!.profile!.profile_picture_url
      } : undefined
    };

    // Add to messages IMMEDIATELY (optimistic)
    setMessages(prev => [...prev, tempMessage]);
    setSending(true);
    setMessageTimestamps(prev => [...prev, Date.now()]);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: currentUserId,
          message: message.trim(),
          message_type: 'text',
          reply_to_id: replyToId
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...data, sender: tempMessage.sender, isTemp: false } as ChatMessage
            : msg
        )
      );

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, isFailed: true, isTemp: false }
            : msg
        )
      );

      toast({
        title: "Failed to send",
        description: "Message could not be sent. Tap to retry.",
        variant: "destructive"
      });

      return false;
    } finally {
      setSending(false);
    }
  }, [currentUserId, roomId, members, checkRateLimit, retryAfter, toast]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId && m.isFailed);
    if (!failedMessage) return;

    // Remove failed message and resend
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await sendMessage(failedMessage.message, failedMessage.reply_to_id ?? undefined);
  }, [messages, sendMessage]);

  // Add reaction (one reaction per user per message)
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = message.reactions || {};
    
    // Check if user already has THIS emoji reaction (for toggle-off)
    const userHasThisReaction = (currentReactions[emoji] || []).includes(currentUserId);
    
    // Build new reactions: first remove user from ALL emoji types
    let newReactions: Record<string, string[]> = {};
    for (const [existingEmoji, userIds] of Object.entries(currentReactions)) {
      const filteredIds = userIds.filter(id => id !== currentUserId);
      if (filteredIds.length > 0) {
        newReactions[existingEmoji] = filteredIds;
      }
    }
    
    // Add the new reaction (unless toggling off the same emoji)
    if (!userHasThisReaction) {
      newReactions[emoji] = [...(newReactions[emoji] || []), currentUserId];
    }

    // Optimistic update
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: newReactions }
          : msg
      )
    );

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert on error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: currentReactions }
            : msg
        )
      );
    }
  }, [currentUserId, messages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;

    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      // Revert on error
      setMessages(prev => [...prev, messageToDelete].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  }, [messages, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!currentUserId || !roomId) return;

    try {
      await supabase
        .from('chat_room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [currentUserId, roomId]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMessages(messages.length, true);
  }, [hasMore, loading, messages.length, fetchMessages]);

  // Typing indicators using broadcast
  const startTyping = useCallback(() => {
    if (isTypingRef.current || !currentUserId) return;
    
    isTypingRef.current = true;
    const channel = supabase.channel(`typing:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, typing: true }
    });
  }, [roomId, currentUserId]);

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current || !currentUserId) return;
    
    isTypingRef.current = false;
    const channel = supabase.channel(`typing:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, typing: false }
    });
  }, [roomId, currentUserId]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [startTyping, stopTyping]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    fetchMessages();
    fetchMembers();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Don't add if it's our own temp message (already added optimistically)
          if (newMessage.sender_id === currentUserId) {
            // Check if we already have this message (from optimistic update)
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id);
              if (exists) return prev;
              
              // Remove any temp messages from this user
              const filtered = prev.filter(m => !m.isTemp || m.sender_id !== currentUserId);
              return [...filtered, newMessage];
            });
            return;
          }

          // Fetch sender profile for other users' messages
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, profile_picture_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const messageWithProfile: ChatMessage = {
            ...newMessage,
            sender: profile ? {
              id: newMessage.sender_id,
              username: profile.username,
              display_name: profile.display_name,
              profile_picture_url: profile.profile_picture_url
            } : undefined
          };

          setMessages(prev => [...prev, messageWithProfile]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updated.id 
                ? { ...msg, ...updated }
                : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMessages(prev => prev.filter(m => m.id !== deleted.id));
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing:${roomId}`)
      .on('broadcast', { event: 'typing' }, async (payload) => {
        const { user_id, typing } = payload.payload as { user_id: string; typing: boolean };
        
        if (user_id === currentUserId) return;

        if (typing) {
          // Fetch user profile if needed
          const member = members.find(m => m.user_id === user_id);
          if (member?.profile) {
            setTypingUsers(prev => {
              if (prev.some(u => u.user_id === user_id)) return prev;
              return [...prev, {
                user_id,
                username: member.profile!.username,
                display_name: member.profile!.display_name ?? undefined
              }];
            });
          }
        } else {
          setTypingUsers(prev => prev.filter(u => u.user_id !== user_id));
        }

        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.user_id !== user_id));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, currentUserId, fetchMessages, fetchMembers, members]);

  return {
    messages,
    members,
    typingUsers,
    loading,
    sending,
    hasMore,
    currentUserId,
    isRateLimited,
    retryAfter,
    sendMessage,
    addReaction,
    deleteMessage,
    retryMessage,
    markAsRead,
    loadMoreMessages,
    handleTyping,
    startTyping,
    stopTyping
  };
};
