import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CHAT_CONFIG } from '@/constants/chat';

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  reply_to_id: string | null;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
  reply_to?: DirectMessage;
  // Optimistic UI flags
  isTemp?: boolean;
  isFailed?: boolean;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  other_participant?: {
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
  last_message?: string;
  unread_count?: number;
}

// Cache helpers
const CACHE_PREFIX = 'dm_messages_';
const CONVERSATIONS_CACHE_KEY = 'dm_conversations';

const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CHAT_CONFIG.CACHE_EXPIRY) {
        return data as T;
      }
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

const setCachedData = <T>(key: string, data: T, maxItems?: number): void => {
  try {
    const dataToCache = maxItems && Array.isArray(data) 
      ? (data as unknown[]).slice(0, maxItems) 
      : data;
    sessionStorage.setItem(key, JSON.stringify({
      data: dataToCache,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore cache errors
  }
};

export const useDirectMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Rate limiting state
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  
  // Typing timeout ref for cleanup
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const recentMessages = messageTimestamps.filter(
      ts => now - ts < CHAT_CONFIG.RATE_LIMIT_WINDOW
    );
    
    if (recentMessages.length >= CHAT_CONFIG.RATE_LIMIT_MAX) {
      const oldestMessage = Math.min(...recentMessages);
      const waitTime = Math.ceil((CHAT_CONFIG.RATE_LIMIT_WINDOW - (now - oldestMessage)) / 1000);
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

  // P0 FIX: Optimized message fetching with batched queries
  const fetchMessages = useCallback(async (convId: string, msgOffset = 0) => {
    try {
      // Try cache for initial load
      if (msgOffset === 0) {
        const cached = getCachedData<DirectMessage[]>(`${CACHE_PREFIX}${convId}`);
        if (cached && cached.length > 0) {
          setMessages(cached);
          setLoading(false);
        }
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .range(msgOffset, msgOffset + CHAT_CONFIG.MESSAGES_PER_PAGE - 1);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setHasMore(false);
        if (msgOffset === 0) setMessages([]);
        return;
      }

      // Collect all unique sender IDs AND reply IDs in one pass
      const senderIds = new Set<string>();
      const replyIds: string[] = [];
      
      messagesData.forEach(msg => {
        senderIds.add(msg.sender_id);
        if (msg.reply_to_id) {
          replyIds.push(msg.reply_to_id);
        }
      });

      // P0 FIX: Batch fetch all profiles at once
      let profileMap = new Map<string, DirectMessage['sender']>();
      if (senderIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, profile_picture_url')
          .in('user_id', Array.from(senderIds));
        
        profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
      }

      // P0 FIX: Batch fetch all reply messages at once (instead of N queries)
      let replyMap = new Map<string, DirectMessage>();
      if (replyIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('direct_messages')
          .select('*')
          .in('id', replyIds);
        
        if (repliesData) {
          // Also collect sender IDs from replies that might not be in our profile map
          const replySenderIds = repliesData
            .map(r => r.sender_id)
            .filter(id => !profileMap.has(id));
          
          if (replySenderIds.length > 0) {
            const { data: replyProfilesData } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, profile_picture_url')
              .in('user_id', replySenderIds);
            
            (replyProfilesData || []).forEach(p => {
              profileMap.set(p.user_id, p);
            });
          }
          
          // Build reply map with sender info
          repliesData.forEach(reply => {
            replyMap.set(reply.id, {
              ...reply,
              sender: profileMap.get(reply.sender_id)
            } as DirectMessage);
          });
        }
      }

      // Map profiles and replies to messages (no async operations here)
      const messagesWithDetails: DirectMessage[] = messagesData.map(msg => ({
        ...msg,
        reactions: msg.reactions || {},
        sender: profileMap.get(msg.sender_id),
        reply_to: msg.reply_to_id ? replyMap.get(msg.reply_to_id) : undefined
      }));

      const reversedMessages = messagesWithDetails.reverse();
      
      setHasMore(messagesData.length === CHAT_CONFIG.MESSAGES_PER_PAGE);
      
      if (msgOffset === 0) {
        setMessages(reversedMessages);
        setCachedData(`${CACHE_PREFIX}${convId}`, reversedMessages, 100);
      } else {
        setMessages(prev => [...reversedMessages, ...prev]);
      }
    } catch (error) {
      console.error('[DM] Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  // P0 FIX: Optimized conversations fetching with batched queries
  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try cache first
      const cached = getCachedData<Conversation[]>(CONVERSATIONS_CACHE_KEY);
      if (cached && cached.length > 0) {
        setConversations(cached);
        setLoading(false);
      }

      // Fetch all conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        return;
      }

      // Collect all "other" user IDs and conversation IDs
      const otherUserIds: string[] = [];
      const conversationIds: string[] = [];
      
      conversationsData.forEach(conv => {
        const otherUserId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;
        otherUserIds.push(otherUserId);
        conversationIds.push(conv.id);
      });

      // P0 FIX: Batch fetch all profiles at once
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, profile_picture_url')
        .in('user_id', otherUserIds);
      
      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

      // P0 FIX: Batch fetch last messages for all conversations
      // Using a single query with distinct on conversation_id
      const { data: lastMessagesData } = await supabase
        .from('direct_messages')
        .select('conversation_id, message, created_at')
        .in('conversation_id', conversationIds)
        .order('conversation_id')
        .order('created_at', { ascending: false });

      // Group by conversation and take the first (latest) message
      const lastMessageMap = new Map<string, string>();
      if (lastMessagesData) {
        const seen = new Set<string>();
        lastMessagesData.forEach(msg => {
          if (!seen.has(msg.conversation_id)) {
            seen.add(msg.conversation_id);
            lastMessageMap.set(msg.conversation_id, msg.message);
          }
        });
      }

      // P0 FIX: Batch fetch unread counts for all conversations
      // We'll fetch all unread messages and count them client-side
      const { data: unreadData } = await supabase
        .from('direct_messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      const unreadCountMap = new Map<string, number>();
      if (unreadData) {
        unreadData.forEach(msg => {
          const current = unreadCountMap.get(msg.conversation_id) || 0;
          unreadCountMap.set(msg.conversation_id, current + 1);
        });
      }

      // Build final conversations array (no async operations here)
      const conversationsWithDetails: Conversation[] = conversationsData.map(conv => {
        const otherUserId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;
        
        return {
          ...conv,
          other_participant: profileMap.get(otherUserId),
          last_message: lastMessageMap.get(conv.id),
          unread_count: unreadCountMap.get(conv.id) || 0
        };
      });

      setConversations(conversationsWithDetails);
      setCachedData(CONVERSATIONS_CACHE_KEY, conversationsWithDetails);
    } catch (error) {
      console.error('[DM] Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  }, []);

  // P1 FIX: Send message with optimistic UI and rate limiting
  const sendMessage = useCallback(async (
    convId: string,
    message: string,
    replyToId?: string
  ): Promise<boolean> => {
    if (!currentUserId || !convId || !message.trim()) return false;
    
    // P1: Check rate limit
    if (!checkRateLimit()) {
      toast.error(`Please wait ${retryAfter} seconds before sending another message`);
      return false;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // P1 FIX: Create optimistic message
    const tempMessage: DirectMessage = {
      id: tempId,
      conversation_id: convId,
      sender_id: currentUserId,
      message: message.trim(),
      is_read: true,
      reply_to_id: replyToId ?? null,
      reactions: {},
      is_edited: false,
      edited_at: null,
      created_at: now,
      updated_at: now,
      isTemp: true,
      isFailed: false
    };

    // Add to messages immediately (optimistic)
    setMessages(prev => [...prev, tempMessage]);
    setSending(true);
    setMessageTimestamps(prev => [...prev, Date.now()]);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: convId,
          sender_id: currentUserId,
          message: message.trim(),
          reply_to_id: replyToId || null
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...data, reactions: {}, isTemp: false, isFailed: false } as DirectMessage
            : msg
        )
      );

      return true;
    } catch (error) {
      console.error('[DM] Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, isFailed: true, isTemp: false }
            : msg
        )
      );

      toast.error('Failed to send message. Tap to retry.');
      return false;
    } finally {
      setSending(false);
    }
  }, [currentUserId, checkRateLimit, retryAfter]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId && m.isFailed);
    if (!failedMessage || !conversationId) return;

    // Remove failed message and resend
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await sendMessage(conversationId, failedMessage.message, failedMessage.reply_to_id ?? undefined);
  }, [messages, conversationId, sendMessage]);

  // Add reaction to message with optimistic UI
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = message.reactions || {};
    
    // Check if user already has THIS emoji reaction (for toggle-off)
    const userHasThisReaction = (currentReactions[emoji] || []).includes(currentUserId);
    
    // Build new reactions: first remove user from ALL emoji types
    const newReactions: Record<string, string[]> = {};
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
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: newReactions }
        : msg
    ));

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('[DM] Error adding reaction:', error);
      // Rollback
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: currentReactions }
          : msg
      ));
      toast.error('Failed to add reaction');
    }
  }, [currentUserId, messages]);

  // Delete a message with optimistic update
  const deleteMessage = useCallback(async (messageId: string) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;

    // Optimistically remove from UI
    setMessages(prev => prev.filter(msg => msg.id !== messageId));

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('[DM] Error deleting message:', error);
      // Restore the message on error
      setMessages(prev => [...prev, messageToDelete].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      toast.error('Failed to delete message');
    }
  }, [messages]);

  // Mark messages as read
  const markAsRead = useCallback(async (convId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('[DM] Error marking messages as read:', error);
    }
  }, [currentUserId]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!conversationId || !hasMore) return;
    const newOffset = offset + CHAT_CONFIG.MESSAGES_PER_PAGE;
    setOffset(newOffset);
    fetchMessages(conversationId, newOffset);
  }, [conversationId, hasMore, offset, fetchMessages]);

  // Send typing indicator with cleanup
  const sendTypingIndicator = useCallback(async (typing: boolean = true) => {
    if (!conversationId || !currentUserId) return;
    
    try {
      const channel = supabase.channel(`conversation:${conversationId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: typing }
      });
    } catch (error) {
      // Silently fail typing indicators
    }
  }, [conversationId, currentUserId]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setOffset(0);
      if (conversationId) {
        await fetchMessages(conversationId);
        await markAsRead(conversationId);
      } else {
        await fetchConversations();
      }
      setLoading(false);
    };

    init();
  }, [conversationId, fetchMessages, fetchConversations, markAsRead]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (conversationId) {
      const messageChannel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'broadcast',
          { event: 'typing' },
          (payload: { payload: { userId: string; isTyping: boolean } }) => {
            if (currentUserId && payload.payload.userId !== currentUserId) {
              setIsTyping(payload.payload.isTyping);
              setTypingUserId(payload.payload.userId);
              
              // P2 FIX: Clear previous timeout to prevent memory leak
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Auto-clear typing indicator after 5 seconds
              if (payload.payload.isTyping) {
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                  setTypingUserId(null);
                }, 5000);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            const newMsg = payload.new as DirectMessage;
            
            // Don't add if it's our own message (already added optimistically)
            if (newMsg.sender_id === currentUserId) {
              setMessages(prev => {
                const exists = prev.some(m => m.id === newMsg.id);
                if (exists) return prev;
                
                // Remove temp messages from this user and add the real one
                const filtered = prev.filter(m => !m.isTemp || m.sender_id !== currentUserId);
                return [...filtered, { ...newMsg, reactions: newMsg.reactions || {} }];
              });
              return;
            }

            // Fetch sender profile for other users' messages
            const { data: senderData } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, profile_picture_url')
              .eq('user_id', newMsg.sender_id)
              .single();

            const messageWithSender: DirectMessage = {
              ...newMsg,
              reactions: newMsg.reactions || {},
              sender: senderData ?? undefined
            };

            setMessages(prev => [...prev, messageWithSender]);
            
            // Mark as read since we're viewing this conversation
            if (currentUserId) {
              await markAsRead(conversationId);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const updated = payload.new as DirectMessage;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === updated.id 
                  ? { ...msg, ...updated, reactions: updated.reactions || msg.reactions }
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
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        )
        .subscribe();

      return () => {
        // P2 FIX: Cleanup typing timeout on unmount
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        supabase.removeChannel(messageChannel);
      };
    } else {
      // Subscribe to conversation updates
      const conversationChannel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationChannel);
      };
    }
  }, [conversationId, currentUserId, fetchConversations, markAsRead]);

  return {
    messages,
    conversations,
    loading,
    sending,
    hasMore,
    isTyping,
    isRateLimited,
    retryAfter,
    currentUserId,
    sendMessage,
    addReaction,
    deleteMessage,
    retryMessage,
    markAsRead,
    loadMoreMessages,
    sendTypingIndicator,
    refetchConversations: fetchConversations
  };
};
