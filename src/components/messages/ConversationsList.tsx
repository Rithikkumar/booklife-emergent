import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import { Conversation } from '@/hooks/useDirectMessages';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId?: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewMessage: () => void;
  isMobile?: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  onNewMessage,
  isMobile = false,
}) => {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string | undefined, maxLength: number = 40) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Messages</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewMessage}
            className="h-9 w-9 p-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No conversations yet</p>
              <Button
                variant="link"
                onClick={onNewMessage}
                className="mt-2"
              >
                Start a new conversation
              </Button>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isSelected = !isMobile && selectedId === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-accent/50
                    ${isSelected ? 'bg-accent' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={conversation.other_participant?.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {conversation.other_participant?.display_name?.[0] || 
                         conversation.other_participant?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {conversation.other_participant?.display_name || 
                             conversation.other_participant?.username || 'Unknown User'}
                          </p>
                          {conversation.other_participant?.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{conversation.other_participant.username}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {truncateMessage(conversation.last_message)}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge 
                            variant="default" 
                            className="h-5 min-w-5 rounded-full flex items-center justify-center px-1.5"
                          >
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationsList;
