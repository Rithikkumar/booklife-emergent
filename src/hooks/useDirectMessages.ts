import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  reply_to_id: string | null;
  reactions: any;
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

export const useDirectMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const MESSAGES_PER_PAGE = 50;

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string, offset = 0) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(user_id, username, display_name, profile_picture_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (messagesError) throw messagesError;

      // Fetch reply messages if needed
      const messagesWithReplies = await Promise.all(
        (messagesData || []).map(async (msg) => {
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('direct_messages')
              .select(`
                *,
                sender:profiles!direct_messages_sender_id_fkey(user_id, username, display_name, profile_picture_url)
              `)
              .eq('id', msg.reply_to_id)
              .single();
            
            return { ...msg, reply_to: replyData };
          }
          return msg;
        })
      );

      setHasMore((messagesData || []).length === MESSAGES_PER_PAGE);
      
      if (offset === 0) {
        setMessages(messagesWithReplies.reverse() as unknown as DirectMessage[]);
      } else {
        setMessages(prev => [...messagesWithReplies.reverse() as unknown as DirectMessage[], ...prev]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  // Fetch all conversations for current user
  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      // Fetch other participant's profile and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          // Fetch other participant's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, profile_picture_url')
            .eq('user_id', otherUserId)
            .single();

          // Fetch last message
          const { data: lastMessageData } = await supabase
            .from('direct_messages')
            .select('message')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_participant: profileData || undefined,
            last_message: lastMessageData?.message,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    conversationId: string,
    message: string,
    replyToId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message,
          reply_to_id: replyToId || null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, []);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current reactions
      const { data: messageData } = await supabase
        .from('direct_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (!messageData) return;

      const reactions = (messageData.reactions as any) || {};
      const userReactions = reactions[emoji] || [];

      let updatedReactions: any;
      if (userReactions.includes(user.id)) {
        // Remove reaction
        updatedReactions = {
          ...(reactions as object),
          [emoji]: userReactions.filter((id: string) => id !== user.id)
        };
        // Remove empty emoji arrays
        if (updatedReactions[emoji].length === 0) {
          delete updatedReactions[emoji];
        }
      } else {
        // Add reaction
        updatedReactions = {
          ...(reactions as object),
          [emoji]: [...userReactions, user.id]
        };
      }

      const { error } = await supabase
        .from('direct_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!conversationId || !hasMore) return;
    const newOffset = offset + MESSAGES_PER_PAGE;
    setOffset(newOffset);
    fetchMessages(conversationId, newOffset);
  }, [conversationId, hasMore, offset, fetchMessages]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (typing: boolean = true) => {
    if (!conversationId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel(`conversation:${conversationId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: typing }
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
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
      // Subscribe to new messages and typing indicators in this conversation
      const messageChannel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'broadcast',
          { event: 'typing' },
          async (payload: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && payload.payload.userId !== user.id) {
              setIsTyping(payload.payload.isTyping);
              setTypingUserId(payload.payload.userId);
              
              // Auto-clear typing indicator after 5 seconds
              if (payload.payload.isTyping) {
                setTimeout(() => {
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
            // Fetch sender profile
            const { data: senderData } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, profile_picture_url')
              .eq('user_id', payload.new.sender_id)
              .single();

            const newMessage = {
              ...payload.new as any,
              sender: senderData,
              reactions: (payload.new as any).reactions || {}
            } as DirectMessage;

            setMessages(prev => [...prev, newMessage]);
            
            // Mark as read if we're viewing this conversation
            const { data: { user } } = await supabase.auth.getUser();
            if (user && (payload.new as any).sender_id !== user.id) {
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
            setMessages(prev =>
              prev.map(msg =>
                msg.id === (payload.new as any).id ? { 
                  ...msg, 
                  ...(payload.new as any),
                  reactions: (payload.new as any).reactions || msg.reactions 
                } as DirectMessage : msg
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
  }, [conversationId, fetchConversations, markAsRead]);

  return {
    messages,
    conversations,
    loading,
    hasMore,
    isTyping,
    sendMessage,
    addReaction,
    deleteMessage,
    markAsRead,
    loadMoreMessages,
    sendTypingIndicator,
    refetchConversations: fetchConversations
  };
};
