import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import TypingIndicator from './TypingIndicator';

interface MessageThreadContentProps {
  conversationId: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const MessageThreadContent: React.FC<MessageThreadContentProps> = ({
  conversationId,
  showBackButton = false,
  onBack,
}) => {
  const { messages, sendMessage, addReaction, deleteMessage, markAsRead, loadMoreMessages, hasMore, isTyping, sendTypingIndicator } = useDirectMessages(conversationId);
  const [currentMessage, setCurrentMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchOtherParticipant = async () => {
      if (!currentUserId) return;

      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          participant_1_id,
          participant_2_id,
          participant_1:profiles!conversations_participant_1_id_fkey(*),
          participant_2:profiles!conversations_participant_2_id_fkey(*)
        `)
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const otherUser = conversation.participant_1_id === currentUserId
          ? conversation.participant_2
          : conversation.participant_1;
        setOtherParticipant(otherUser);
      }
    };

    fetchOtherParticipant();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    await sendMessage(conversationId, currentMessage, replyingTo?.id);
    setCurrentMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
    
    // Send typing indicator
    if (sendTypingIndicator) {
      sendTypingIndicator();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (sendTypingIndicator) {
        sendTypingIndicator(false);
      }
    }, 3000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentMessage(prev => prev + emoji);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const renderMessage = (message: any) => {
    const isSent = message.sender_id === currentUserId;

    return (
      <MessageBubble
        key={message.id}
        message={message.message}
        timestamp={message.created_at}
        isSent={isSent}
        senderName={message.sender?.display_name || message.sender?.username}
        senderAvatar={message.sender?.profile_picture_url}
        isRead={message.is_read}
        isDelivered={true}
        replyTo={message.reply_to ? {
          message: message.reply_to.message,
          senderName: message.reply_to.sender?.display_name || message.reply_to.sender?.username || 'Unknown'
        } : undefined}
      />
    );
  };

  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherParticipant?.profile_picture_url || undefined} />
          <AvatarFallback>
            {otherParticipant?.display_name?.[0] || otherParticipant?.username?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {otherParticipant?.display_name || otherParticipant?.username || 'Unknown User'}
          </p>
          {otherParticipant?.username && (
            <p className="text-sm text-muted-foreground truncate">
              @{otherParticipant.username}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-full p-4" ref={scrollRef}>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMoreMessages}
            className="w-full mb-4"
          >
            Load more messages
          </Button>
        )}
        
        <div className="space-y-1">
          {messages.map(renderMessage)}
          
          {/* Typing Indicator */}
          {isTyping && otherParticipant && (
            <TypingIndicator
              userName={otherParticipant.display_name || otherParticipant.username}
              userAvatar={otherParticipant.profile_picture_url}
            />
          )}
        </div>
      </ScrollArea>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Replying to</p>
            <p className="text-sm truncate">{replyingTo.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex gap-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0 hover:bg-accent"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          
          <Textarea
            placeholder="Type a message..."
            value={currentMessage}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            className="min-h-[44px] max-h-32 resize-none flex-1"
            rows={1}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim()}
            className="h-11 w-11 p-0 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MessageThreadContent;
