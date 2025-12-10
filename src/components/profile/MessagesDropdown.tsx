import { MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

const MessagesDropdown = () => {
  const { conversations } = useDirectMessages();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Calculate total unread count
  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);

  // Don't show messages icon if user is not authenticated
  if (!isAuthenticated) return null;

  return (
    <Link to="/messages">
      <Button variant="ghost" size="sm" className="relative p-2 hover:bg-accent">
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
  );
};

export default MessagesDropdown;
