import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  MessageCircle, 
  Reply, 
  MoreVertical,
  Heart,
  ThumbsUp,
  Smile,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCommunityChat, ChatMessage } from '@/hooks/useCommunityChat';
import { useMessagingPermissions } from '@/hooks/useMessagingPermissions';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CommunityChatProps {
  communityId: string;
  communityName: string;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ communityId, communityName }) => {
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    messages,
    typingUsers,
    sendingMessage,
    hasMore,
    loadingMore,
    sendMessage,
    addReaction,
    deleteMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
  } = useCommunityChat(communityId);

  const {
    canSendMessages,
    loading: permissionsLoading,
    isOwner,
    isAdmin,
    restrictMessaging
  } = useMessagingPermissions(communityId);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !canSendMessages) return;

    await sendMessage(message, 'text', replyingTo?.id);
    setMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    if (!canSendMessages) return;
    
    setMessage(value);
    
    // Trigger typing indicator
    if (value.trim() && !sendingMessage) {
      startTyping();
    } else if (!value.trim()) {
      stopTyping();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  const getDisplayName = (message: ChatMessage) => {
    return message.user_profile?.display_name || 
           message.user_profile?.username || 
           'Anonymous User';
  };

  const getUserInitials = (message: ChatMessage) => {
    const name = getDisplayName(message);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = currentUserId === msg.user_id;
    const reactionEmojis = ['❤️', '👍', '😄', '😮', '😢', '😡'];

    return (
      <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} group`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={msg.user_profile?.profile_picture_url} />
          <AvatarFallback className="text-xs">
            {getUserInitials(msg)}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{getDisplayName(msg)}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(msg.created_at)}
            </span>
            {msg.is_edited && (
              <Badge variant="outline" className="text-xs">Edited</Badge>
            )}
          </div>

          {msg.reply_to_message && (
            <div className="bg-muted/50 border-l-2 border-primary/50 pl-3 py-2 mb-2 rounded text-sm">
              <div className="text-xs text-muted-foreground mb-1">
                Replying to {msg.reply_to_message.user_profile?.display_name || msg.reply_to_message.user_profile?.username}
              </div>
              <div className="text-muted-foreground line-clamp-2">
                {msg.reply_to_message.message}
              </div>
            </div>
          )}

          <div className={`relative ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} 
                          rounded-lg px-3 py-2 w-fit max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            
            {/* Message actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 right-2">
              <div className="flex items-center gap-1 bg-background border rounded-md p-1 shadow-sm">
                {reactionEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs hover:bg-primary/10"
                    onClick={() => handleReaction(msg.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setReplyingTo(msg)}
                >
                  <Reply className="h-3 w-3" />
                </Button>

                {isOwnMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => deleteMessage(msg.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Reactions */}
          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(msg.reactions).map(([emoji, userIds]) => 
                userIds.length > 0 && (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className={`h-6 px-2 text-xs ${
                      userIds.includes(currentUserId || '') ? 'bg-primary/10 border-primary/50' : ''
                    }`}
                    onClick={() => handleReaction(msg.id, emoji)}
                  >
                    {emoji} {userIds.length}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {communityName} Chat
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {/* Load more button */}
            {hasMore && messages.length > 0 && (
              <div className="text-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more messages'
                  )}
                </Button>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                </div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].profiles?.display_name || typingUsers[0].profiles?.username} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Replying to </span>
              <span className="font-medium">{getDisplayName(replyingTo)}</span>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {replyingTo.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              ×
            </Button>
          </div>
        )}

        {/* Message input or restriction notice */}
        {restrictMessaging && !canSendMessages ? (
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-center gap-3 text-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">
                  Only community owners and admins can send messages in this community.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <Textarea
                ref={messageInputRef}
                placeholder={`Message ${communityName}...`}
                value={message}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={stopTyping}
                className="min-h-[40px] max-h-[120px] resize-none"
                disabled={sendingMessage || !canSendMessages || permissionsLoading}
                maxLength={2000}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || sendingMessage || !canSendMessages || permissionsLoading}
                className="self-end"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{message.length}/2000</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityChat;