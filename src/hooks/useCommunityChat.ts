import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

  // Fetch messages with pagination - optimized with join
  const fetchMessages = useCallback(async (offset = 0, limit = 50) => {
    if (!communityId) return;

    try {
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
        } else {
          setMessages(prev => [...transformedMessages as ChatMessage[], ...prev]);
        }
        
        setHasMore(messagesData.length === limit);
      } else {
        if (offset === 0) {
          setMessages([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [communityId, toast]);

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

  // Send a message
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

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Stop typing indicator when sending
      await stopTyping();

      const { error } = await supabase
        .from('community_messages')
        .insert({
          community_id: communityId,
          user_id: user.id,
          message: message.trim(),
          message_type: messageType,
          reply_to_id: replyToId,
        });

      if (error) throw error;

      // Update user's last active timestamp
      await supabase
        .from('community_members')
        .update({ last_active_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [communityId, toast]);

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

  // Typing indicator functions
  const startTyping = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use proper upsert with onConflict
      await supabase
        .from('community_typing_indicators')
        .upsert({
          community_id: communityId,
          user_id: user.id,
          expires_at: new Date(Date.now() + 10000).toISOString()
        }, {
          onConflict: 'community_id,user_id'
        });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 8 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 8000);
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  }, [communityId]);

  const stopTyping = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('community_typing_indicators')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!communityId) return;

    setLoading(true);
    fetchMessages().then(() => setLoading(false));
    fetchMembers();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('community-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          // Fetch the new message with user profile in a single query
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
            
            setMessages(prev => [...prev, transformedMessage as ChatMessage]);
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
      .channel('community-members')
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

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`community-typing-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_typing_indicators',
          filter: `community_id=eq.${communityId}`,
        },
        async () => {
          // Fetch current typing users
          const { data } = await supabase
            .from('community_typing_indicators')
            .select(`
              user_id,
              profiles!community_typing_indicators_user_id_fkey (
                username,
                display_name
              )
            `)
            .eq('community_id', communityId)
            .gt('expires_at', new Date().toISOString());

          const currentUser = (await supabase.auth.getUser()).data.user;
          const filteredTypingUsers = data?.filter(indicator => 
            indicator.user_id !== currentUser?.id
          ) || [];

          setTypingUsers(filteredTypingUsers.map(indicator => ({
            user_id: indicator.user_id,
            profiles: indicator.profiles
          })));
        }
      )
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
  }, [communityId, fetchMessages, fetchMembers, stopTyping]);

  return {
    messages,
    members,
    typingUsers,
    loading,
    sendingMessage,
    hasMore,
    loadingMore,
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