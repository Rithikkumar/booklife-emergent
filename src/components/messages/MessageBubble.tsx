import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: string;
  isRead?: boolean;
  isDelivered?: boolean;
  replyTo?: {
    message: string;
    senderName: string;
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  timestamp,
  isSent,
  senderName,
  senderAvatar,
  isRead = false,
  isDelivered = false,
  replyTo,
}) => {
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={cn("flex gap-2 mb-4", isSent ? "justify-end" : "justify-start")}>
      {!isSent && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {senderName?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col max-w-[70%]", isSent ? "items-end" : "items-start")}>
        {!isSent && senderName && (
          <span className="text-xs text-muted-foreground mb-1 px-2">{senderName}</span>
        )}
        
        <div className="relative">
          {/* Message bubble tail */}
          <div 
            className={cn(
              "absolute top-0 w-0 h-0",
              isSent 
                ? "right-0 border-l-8 border-l-primary border-t-8 border-t-transparent" 
                : "left-0 border-r-8 border-r-accent border-t-8 border-t-transparent"
            )}
            style={{ transform: isSent ? 'translateX(100%)' : 'translateX(-100%)' }}
          />
          
          <div
            className={cn(
              "rounded-lg px-3 py-2 break-words",
              isSent
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            )}
          >
            {replyTo && (
              <div className={cn(
                "border-l-4 pl-2 mb-2 py-1 text-xs opacity-70",
                isSent ? "border-primary-foreground/30" : "border-primary/30"
              )}>
                <div className="font-semibold">{replyTo.senderName}</div>
                <div className="line-clamp-1">{replyTo.message}</div>
              </div>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            
            <div className={cn(
              "flex items-center gap-1 justify-end mt-1 text-xs opacity-70",
              isSent ? "text-primary-foreground" : "text-muted-foreground"
            )}>
              <span>{formatTime(timestamp)}</span>
              {isSent && (
                <span className="ml-1">
                  {isRead ? (
                    <CheckCheck className="h-3 w-3 text-blue-400" />
                  ) : isDelivered ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
