import { MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/contexts/AuthContext';

const MessagesDropdown = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { conversations } = useDirectMessages();

  // Calculate total unread count
  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);

  // Always render the same container structure to prevent layout shift
  // The container maintains consistent dimensions regardless of auth state
  return (
    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
      {isLoading ? (
        // Loading skeleton with exact same dimensions
        <div className="w-9 h-9 rounded-md bg-muted/50 animate-pulse" />
      ) : isAuthenticated ? (
        <Link to="/messages">
          <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 hover:bg-accent">
            <MessagesSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </Badge>
            )}
          </Button>
        </Link>
      ) : (
        // Invisible placeholder with exact same dimensions to prevent layout shift
        <div className="w-9 h-9" aria-hidden="true" />
      )}
    </div>
  );
};

export default MessagesDropdown;
