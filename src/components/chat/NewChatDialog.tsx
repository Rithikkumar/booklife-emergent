import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  user_id: string;
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
}

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated?: (roomId: string) => void;
}

export const NewChatDialog: React.FC<NewChatDialogProps> = ({
  open,
  onOpenChange,
  onChatCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, profile_picture_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', user?.id)
        .limit(15);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  const startChat = async (user: User) => {
    setStarting(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_chat_room', {
        p_other_user_id: user.user_id
      });

      if (error) throw error;

      onChatCreated?.(data);
      onOpenChange(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Failed to start chat",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setStarting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or username..."
              className="pl-9"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          <ScrollArea className="h-[300px]">
            {searchQuery.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Search for someone to start a conversation
                </p>
              </div>
            ) : searchResults.length === 0 && !searching ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No users found matching "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map(user => (
                  <button
                    key={user.user_id}
                    onClick={() => startChat(user)}
                    disabled={starting}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg',
                      'hover:bg-muted transition-colors text-left',
                      starting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_picture_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.display_name || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                    {starting && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
