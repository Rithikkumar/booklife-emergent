import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  userName: string;
  userAvatar?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, userAvatar }) => {
  return (
    <div className="flex gap-2 mb-4 items-end">
      <Avatar className="h-8 w-8">
        <AvatarImage src={userAvatar} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {userName?.charAt(0).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-accent rounded-lg px-4 py-3 flex items-center gap-1">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
