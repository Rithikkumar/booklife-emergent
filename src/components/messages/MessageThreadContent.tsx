import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDirectMessages, DirectMessage } from '@/hooks/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import TypingIndicator from './TypingIndicator';
import { CHAT_CONFIG } from '@/constants/chat';

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
  const { 
    messages, 
    sendMessage, 
    addReaction, 
    deleteMessage, 
    retryMessage,
    markAsRead, 
    loadMoreMessages, 
    hasMore, 
    isTyping, 
    isRateLimited,
    retryAfter,
    sending,
    sendTypingIndicator,
    currentUserId: hookUserId
  } = useDirectMessages(conversationId);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<{
    user_id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchOtherParticipant = async () => {
      if (!hookUserId) return;

      // Fetch the conversation without foreign key joins
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError || !conversation) {
        return;
      }

      // Determine the other participant's ID
      const otherUserId = conversation.participant_1_id === hookUserId
        ? conversation.participant_2_id
        : conversation.participant_1_id;

      // Fetch the other participant's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, profile_picture_url')
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (profileData) {
        setOtherParticipant(profileData);
      }
    };

    fetchOtherParticipant();
  }, [conversationId, hookUserId]);

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
    }, CHAT_CONFIG.TYPING_TIMEOUT);
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentMessage(prev => prev + emoji);
  };

  const renderMessage = (message: DirectMessage) => {
    const isSent = message.sender_id === hookUserId;

    return (
      <div key={message.id} className="relative">
        <MessageBubble
          message={message.message}
          timestamp={message.created_at}
          isSent={isSent}
          senderName={message.sender?.display_name || message.sender?.username}
          senderAvatar={message.sender?.profile_picture_url}
          isRead={message.is_read}
          isDelivered={!message.isTemp}
          replyTo={message.reply_to ? {
            message: message.reply_to.message,
            senderName: message.reply_to.sender?.display_name || message.reply_to.sender?.username || 'Unknown'
          } : undefined}
        />
        {/* Failed message retry button */}
        {message.isFailed && (
          <div className="flex justify-end mt-1 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryMessage(message.id)}
              className="h-6 text-xs text-destructive hover:text-destructive"
              data-testid={`retry-message-${message.id}`}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {/* Sending indicator */}
        {message.isTemp && !message.isFailed && (
          <div className="flex justify-end mt-1 pr-2">
            <span className="text-xs text-muted-foreground">Sending...</span>
          </div>
        )}
      </div>
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
