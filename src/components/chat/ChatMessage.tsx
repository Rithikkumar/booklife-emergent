import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, MoreVertical, Reply, Smile, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import type { ChatMessage as ChatMessageType } from '@/hooks/useChat';

interface ChatMessageProps {
  message: ChatMessageType;
  isSent: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  showReadReceipts?: boolean;
  isRead?: boolean;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isSent,
  showAvatar = true,
  showSenderName = true,
  showReadReceipts = false,
  isRead = false,
  onReact,
  onReply,
  onDelete,
  onRetry
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'dd/MM HH:mm');
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const hasReactions = Object.keys(message.reactions || {}).length > 0;

  return (
    <div
      className={cn(
        'group flex gap-2 px-4 py-1 transition-colors hover:bg-muted/30',
        isSent ? 'flex-row-reverse' : 'flex-row',
        message.isFailed && 'opacity-70'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isSent && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src={message.sender?.profile_picture_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer for sent messages alignment */}
      {showAvatar && isSent && <div className="w-8 shrink-0" />}

      {/* Message content */}
      <div className={cn('flex flex-col max-w-[70%]', isSent ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {showSenderName && !isSent && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className={cn(
            'text-xs px-3 py-1.5 mb-1 rounded-lg border-l-2',
            isSent 
              ? 'bg-primary/5 border-primary/50 text-primary-foreground/70' 
              : 'bg-muted/50 border-muted-foreground/30 text-muted-foreground'
          )}>
            <span className="font-medium">{message.reply_to.sender_name || 'Unknown'}</span>
            <p className="truncate max-w-[200px]">{message.reply_to.message}</p>
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          'relative px-3 py-2 rounded-2xl shadow-sm',
          isSent 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-muted text-foreground rounded-bl-md',
          message.isTemp && 'animate-pulse',
          message.isFailed && 'bg-destructive/20 border border-destructive/50'
        )}>
          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.message}
          </p>

          {/* Timestamp and status */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isSent ? 'justify-end' : 'justify-start'
          )}>
            {message.is_edited && (
              <span className="text-[10px] opacity-60 mr-1">edited</span>
            )}
            <span className={cn(
              'text-[10px]',
              isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {formatTimestamp(message.created_at)}
            </span>

            {/* Read receipts for sent messages */}
            {isSent && showReadReceipts && !message.isFailed && !message.isTemp && (
              <span className={cn('ml-0.5', isRead ? 'text-blue-400' : 'text-primary-foreground/50')}>
                {isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </span>
            )}

            {/* Failed indicator */}
            {message.isFailed && (
              <AlertCircle className="h-3 w-3 text-destructive ml-1" />
            )}

            {/* Sending indicator */}
            {message.isTemp && !message.isFailed && (
              <span className={cn(
                'h-2 w-2 rounded-full animate-pulse ml-1',
                isSent ? 'bg-primary-foreground/50' : 'bg-muted-foreground/50'
              )} />
            )}
          </div>
        </div>

        {/* Retry button for failed messages */}
        {message.isFailed && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-1 h-6 text-xs text-destructive hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}

        {/* Reactions */}
        {hasReactions && (
          <div className={cn(
            'flex flex-wrap gap-1 mt-1',
            isSent ? 'justify-end' : 'justify-start'
          )}>
            {Object.entries(message.reactions || {}).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => onReact?.(emoji)}
                  className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                    'bg-muted hover:bg-muted/80 border border-border/50'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-muted-foreground">{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>

      {/* Actions (hover) */}
      <div className={cn(
        'flex items-center gap-1 transition-opacity',
        showActions ? 'opacity-100' : 'opacity-0',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Quick react */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            className="w-auto p-2"
            align={isSent ? 'end' : 'start'}
          >
            <div className="flex gap-1">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Reply */}
        {onReply && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
            <Reply className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}

        {/* More options */}
        {isSent && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSent ? 'end' : 'start'}>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
