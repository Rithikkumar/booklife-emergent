import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronDown, Loader2, Users } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import TypingIndicator from '@/components/messages/TypingIndicator';
import { useChat, type ChatMessage as ChatMessageType, type ChatRoomMember } from '@/hooks/useChat';

interface ChatContainerProps {
  roomId: string;
  roomType?: 'direct' | 'group';
  roomName?: string;
  roomAvatar?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  showMemberCount?: boolean;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  roomId,
  roomType = 'direct',
  roomName,
  roomAvatar,
  onBack,
  showBackButton = true,
  showMemberCount = false,
  className
}) => {
  const {
    messages,
    members,
    typingUsers,
    loading,
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
    handleTyping
  } = useChat({ roomId });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Get the other participant for direct chats
  const otherMember = roomType === 'direct' 
    ? members.find(m => m.user_id !== currentUserId)
    : null;

  const displayName = roomName || otherMember?.profile?.display_name || otherMember?.profile?.username || 'Chat';
  const displayAvatar = roomAvatar || otherMember?.profile?.profile_picture_url;

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages, autoScroll, scrollToBottom]);

  // Mark as read when viewing
  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom && messages.length > 10);
  }, [messages.length]);

  // Check read status (simplified - in real app you'd compare timestamps)
  const isMessageRead = useCallback((msg: ChatMessageType) => {
    if (msg.sender_id !== currentUserId) return false;
    // Check if other members have read this message
    const otherMembers = members.filter(m => m.user_id !== currentUserId);
    return otherMembers.some(m => 
      m.last_read_at && new Date(m.last_read_at) >= new Date(msg.created_at)
    );
  }, [currentUserId, members]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && messages.length === 0) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3 p-4 border-b">
          {showBackButton && <Skeleton className="h-8 w-8 rounded-full" />}
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'justify-end')}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
              <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-40')} />
            </div>
          ))}
        </div>

        {/* Input skeleton */}
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
        {showBackButton && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10">
          <AvatarImage src={displayAvatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {roomType === 'group' ? <Users className="h-5 w-5" /> : getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{displayName}</h2>
          {showMemberCount && members.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          )}
          {typingUsers.length > 0 && !showMemberCount && (
            <p className="text-xs text-muted-foreground animate-pulse">
              typing...
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loading}
              className="text-muted-foreground"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load earlier messages
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="py-2">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSent={msg.sender_id === currentUserId}
              showAvatar={roomType !== 'direct' || msg.sender_id !== currentUserId}
              showSenderName={roomType !== 'direct' && msg.sender_id !== currentUserId}
              showReadReceipts={roomType === 'direct'}
              isRead={isMessageRead(msg)}
              onReact={(emoji) => addReaction(msg.id, emoji)}
              onReply={() => setReplyingTo(msg)}
              onDelete={msg.sender_id === currentUserId ? () => deleteMessage(msg.id) : undefined}
              onRetry={msg.isFailed ? () => retryMessage(msg.id) : undefined}
            />
          ))}
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 pb-2">
            {typingUsers.map(user => (
              <TypingIndicator 
                key={user.user_id}
                userName={user.display_name || user.username || 'Someone'} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={() => scrollToBottom()}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        isRateLimited={isRateLimited}
        retryAfter={retryAfter}
      />
    </div>
  );
};
