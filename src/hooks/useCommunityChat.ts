import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRateLimiter } from './useRateLimiter';

export interface ChatMessage {
  id: string;
  community_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'system' | 'announcement';
  reply_to_id?: string;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string;
    display_name?: string;
    profile_picture_url?: string;
  };
  reply_to_message?: ChatMessage;
}

export interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  engagement_score: number;
  last_active_at?: string;
  profile: {
    username: string;
    display_name?: string;
    profile_picture_url?: string;
  };
}

interface TypingIndicator {
  user_id: string;
  profiles?: {
    username: string;
    display_name?: string;
  };
}

export const useCommunityChat = (communityId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const currentUserProfileRef = useRef<{ username: string; display_name?: string; profile_picture_url?: string } | null>(null);
  const messageCacheKey = communityId ? `community_messages_${communityId}` : null;
  
  // Client-side rate limiting
  const { checkRateLimit, isRateLimited, retryAfter } = useRateLimiter({
    maxMessages: 10,
    windowMs: 60000, // 1 minute
  });

  // Fetch messages with pagination - optimized with join and caching
  const fetchMessages = useCallback(async (offset = 0, limit = 50) => {
    if (!communityId) return;

    try {
      // Check cache first (only for initial load)
      if (offset === 0 && messageCacheKey) {
        const cached = localStorage.getItem(messageCacheKey);
        if (cached) {
          try {
            const cachedMessages = JSON.parse(cached);
            setMessages(cachedMessages);
            // Don't fetch in background - prevents recursive loop
            return;
          } catch (e) {
            console.error('Failed to parse cached messages:', e);
            localStorage.removeItem(messageCacheKey);
          }
        }
      }

      // Get messages with user profiles in a single query using join
      const { data: messagesData, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          profiles!user_id (
            user_id,
            username,
            display_name,
            profile_picture_url
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (messagesData && messagesData.length > 0) {
        const transformedMessages = messagesData.reverse().map(msg => ({
          ...msg,
          user_profile: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
          message_type: msg.message_type as 'text' | 'system' | 'announcement',
        }));

        if (offset === 0) {
          setMessages(transformedMessages as ChatMessage[]);
          // Cache last 50 messages
          if (messageCacheKey) {
            localStorage.setItem(messageCacheKey, JSON.stringify(transformedMessages.slice(-50)));
          }
        } else {
          setMessages(prev => [...transformedMessages as ChatMessage[], ...prev]);
        }
        
        setHasMore(messagesData.length === limit);
      } else {
        setHasMore(false);
        // Only clear messages if this is initial load AND we have no messages
        // This prevents wiping existing messages on transient empty responses
        if (offset === 0 && messages.length === 0) {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [communityId, toast, messageCacheKey]);

  // Fetch community members
  const fetchMembers = useCallback(async () => {
    if (!communityId) return;

    try {
      // First get members
      const { data: membersData, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .order('engagement_score', { ascending: false });

      if (error) throw error;

      // Then get user profiles for all members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(member => member.user_id);
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, profile_picture_url')
          .in('user_id', userIds);

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const transformedMembers = membersData.map(member => ({
          ...member,
          profile: profilesMap.get(member.user_id) || {
            username: 'Unknown User',
            display_name: null,
            profile_picture_url: null,
          }
        }));

        setMembers(transformedMembers as CommunityMember[]);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [communityId]);

  // Send a message via Edge Function
  const sendMessage = useCallback(async (
    message: string, 
    messageType: 'text' | 'announcement' = 'text',
    replyToId?: string
  ) => {
    if (!communityId || !message.trim()) return;

    // Validate message length
    if (message.trim().length > 2000) {
      toast({
        title: 'Error',
        description: 'Message cannot exceed 2000 characters',
        variant: 'destructive'
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create temporary message ID and timestamp
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempTimestamp = new Date().toISOString();

    // Optimistically add message to state IMMEDIATELY
    const optimisticMessage: ChatMessage = {
      id: tempId,
      community_id: communityId,
      user_id: user.id,
      message: message.trim(),
      message_type: messageType,
      reply_to_id: replyToId,
      reactions: {},
      is_edited: false,
      created_at: tempTimestamp,
      updated_at: tempTimestamp,
      user_profile: currentUserProfileRef.current || { username: 'You' },
    };

      setMessages(prev => [...prev, optimisticMessage]);
      setSendingMessage(true);

      // Safeguard: Remove temp message if not replaced within 10 seconds
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }, 10000);

    // All async operations happen in background without blocking UI
    try {
      // Stop typing indicator (non-blocking) - clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
      
      // Broadcast stop typing
      const channel = supabase.channel(`community-typing:${communityId}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          is_typing: false,
        }
      }).catch(() => {});

      // Client-side rate limiting check
      if (!checkRateLimit()) {
        // Remove optimistic message
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setSendingMessage(false);
        
        toast({
          title: "Slow down",
          description: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
          variant: "destructive",
        });
        return;
      }

      // Direct database insert (like direct messages)
      const { data: insertedMessage, error } = await supabase
        .from('community_messages')
        .insert({
          community_id: communityId,
          user_id: user.id,
          message: message.trim(), // Trigger will sanitize
          message_type: messageType,
          reply_to_id: replyToId || null,
        })
        .select(`
          *,
          profiles!user_id (
            user_id,
            username,
            display_name,
            profile_picture_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Replace temp message with real message from server
      if (insertedMessage) {
        const transformedMessage: ChatMessage = {
          ...insertedMessage,
          user_profile: Array.isArray(insertedMessage.profiles) 
            ? insertedMessage.profiles[0] 
            : insertedMessage.profiles,
          message_type: insertedMessage.message_type as 'text' | 'system' | 'announcement',
          reactions: insertedMessage.reactions as Record<string, string[]> || {},
        };
        
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === tempId ? transformedMessage : msg
          );
          // Update cache with latest state (not stale closure)
          if (messageCacheKey) {
            localStorage.setItem(messageCacheKey, JSON.stringify(updated.slice(-50)));
          }
          return updated;
        });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // User-friendly error messages
      if (error.message?.includes('Message cannot be empty')) {
        toast({
          title: 'Error',
          description: 'Message cannot be empty',
          variant: 'destructive'
        });
      } else if (error.message?.includes('exceed 2000 characters')) {
        toast({
          title: 'Error',
          description: 'Message too long (max 2000 characters)',
          variant: 'destructive'
        });
      } else if (error.message?.includes('row-level security')) {
        toast({
          title: 'Error',
          description: "You don't have permission to send messages in this community",
          variant: 'destructive'
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSendingMessage(false);
    }
  }, [communityId, toast, messageCacheKey]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || {};
      const userReactions = currentReactions[emoji] || [];
      
      let newReactions;
      if (userReactions.includes(user.id)) {
        // Remove reaction
        newReactions = {
          ...currentReactions,
          [emoji]: userReactions.filter(id => id !== user.id)
        };
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        // Add reaction
        newReactions = {
          ...currentReactions,
          [emoji]: [...userReactions, user.id]
        };
      }

      const { error } = await supabase
        .from('community_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  }, [messages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Typing indicator functions - using Broadcast for real-time performance
  const startTyping = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Broadcast typing status (no DB write!)
      const channel = supabase.channel(`community-typing:${communityId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username: currentUserProfileRef.current?.username || 'User',
          display_name: currentUserProfileRef.current?.display_name,
          is_typing: true,
        }
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 5 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 5000);
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  }, [communityId]);

  const stopTyping = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Broadcast stop typing
      const channel = supabase.channel(`community-typing:${communityId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          is_typing: false,
        }
      });

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    } catch (error) {
      console.error('Failed to stop typing:', error);
    }
  }, [communityId]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    await fetchMessages(messages.length);
    setLoadingMore(false);
  }, [fetchMessages, messages.length, hasMore, loadingMore]);

  // Fetch and cache current user profile on mount
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !currentUserProfileRef.current) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name, profile_picture_url')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) {
          currentUserProfileRef.current = profileData;
        }
      }
    };
    fetchCurrentUserProfile();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!communityId) return;

    setLoading(true);
    fetchMessages().then(() => setLoading(false));
    fetchMembers();

    // Consolidated message subscription channel
    const messagesChannel = supabase
      .channel(`community-messages:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          
          // Skip processing for current user's messages - sendMessage already handles them
          if (user && payload.new.user_id === user.id) {
            return;
          }

          // Only fetch and add messages from OTHER users
          const { data: messageData, error: msgError } = await supabase
            .from('community_messages')
            .select(`
              *,
              profiles!user_id (
                user_id,
                username,
                display_name,
                profile_picture_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!msgError && messageData) {
            const transformedMessage = {
              ...messageData,
              user_profile: Array.isArray(messageData.profiles) ? messageData.profiles[0] : messageData.profiles,
              message_type: messageData.message_type as 'text' | 'system' | 'announcement',
            };
            
            setMessages(prev => {
              const newMessages = [...prev, transformedMessage as ChatMessage];
              // Update cache with new message
              if (messageCacheKey) {
                localStorage.setItem(messageCacheKey, JSON.stringify(newMessages.slice(-50)));
              }
              return newMessages;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          // Fetch the updated message with user profile in a single query
          const { data: messageData, error: msgError } = await supabase
            .from('community_messages')
            .select(`
              *,
              profiles!user_id (
                user_id,
                username,
                display_name,
                profile_picture_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!msgError && messageData) {
            const transformedMessage = {
              ...messageData,
              user_profile: Array.isArray(messageData.profiles) ? messageData.profiles[0] : messageData.profiles,
              message_type: messageData.message_type as 'text' | 'system' | 'announcement',
            };
            
            setMessages(prev => prev.map(msg => 
              msg.id === transformedMessage.id ? transformedMessage as ChatMessage : msg
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to member updates
    const membersChannel = supabase
      .channel(`community-members:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    // Subscribe to typing indicators via Broadcast (no database load!)
    const typingChannel = supabase
      .channel(`community-typing:${communityId}`, {
        config: { broadcast: { self: true } }
      })
      .on('broadcast', { event: 'typing' }, async ({ payload }) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Only show typing for other users
        if (user && payload.user_id !== user.id) {
          if (payload.is_typing) {
            setTypingUsers(prev => {
              const existing = prev.find(u => u.user_id === payload.user_id);
              if (!existing) {
                return [...prev, {
                  user_id: payload.user_id,
                  profiles: {
                    username: payload.username,
                    display_name: payload.display_name
                  }
                }];
              }
              return prev;
            });

            // Auto-remove typing indicator after 6 seconds
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u.user_id !== payload.user_id));
            }, 6000);
          } else {
            setTypingUsers(prev => prev.filter(u => u.user_id !== payload.user_id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(typingChannel);
      
      // Clear typing timeout on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing when leaving
      stopTyping();
    };
  }, [communityId, fetchMessages, fetchMembers, stopTyping, messageCacheKey]);

  return {
    messages,
    members,
    typingUsers,
    loading,
    sendingMessage,
    hasMore,
    loadingMore,
    isRateLimited,
    retryAfter,
    sendMessage,
    addReaction,
    deleteMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    refreshMessages: fetchMessages,
    refreshMembers: fetchMembers,
  };
};