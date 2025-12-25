import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, X, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  user_id: string;
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (roomId: string) => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onOpenChange,
  onGroupCreated
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
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
        .limit(10);

      if (error) throw error;

      // Filter out already selected members
      const filtered = (data || []).filter(
        u => !selectedMembers.some(m => m.user_id === u.user_id)
      );
      
      setSearchResults(filtered);
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

  const addMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => u.user_id !== user.user_id));
    setSearchQuery('');
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(u => u.user_id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive"
      });
      return;
    }

    if (selectedMembers.length < 1) {
      toast({
        title: "Add members",
        description: "Please add at least one member to the group",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const memberIds = selectedMembers.map(m => m.user_id);
      
      const { data, error } = await supabase.rpc('create_group_chat', {
        p_name: groupName.trim(),
        p_member_ids: memberIds,
        p_description: description.trim() || null
      });

      if (error) throw error;

      toast({
        title: "Group created!",
        description: `${groupName} has been created with ${selectedMembers.length + 1} members`
      });

      onGroupCreated?.(data);
      onOpenChange(false);

      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Failed to create group",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name *</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Members ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(member => (
                  <Badge
                    key={member.user_id}
                    variant="secondary"
                    className="pl-1 pr-1 py-1 gap-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.profile_picture_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(member.display_name || member.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.display_name || member.username}</span>
                    <button
                      onClick={() => removeMember(member.user_id)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add members */}
          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or username..."
                className="pl-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[150px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {searchResults.map(user => (
                    <button
                      key={user.user_id}
                      onClick={() => addMember(user)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg',
                        'hover:bg-muted transition-colors text-left'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile_picture_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.display_name || user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={creating || !groupName.trim()}>
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
