import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  UserMinus, 
  UserPlus,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CommunityMember } from '@/hooks/useCommunityChat';

interface ManageMembersDialogProps {
  members: CommunityMember[];
  communityId: string;
  currentUserRole: string;
  onUpdate: () => void;
  compact?: boolean;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ 
  members, 
  communityId, 
  currentUserRole,
  onUpdate,
  compact = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'remove' | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isCurrentUserAdmin = currentUserRole === 'admin';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'moderator':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getDisplayName = (member: CommunityMember) => {
    return member.profile?.display_name || member.profile?.username || 'Anonymous User';
  };

  const getUserInitials = (member: CommunityMember) => {
    const name = getDisplayName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredMembers = members.filter(member =>
    getDisplayName(member).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMembers = filteredMembers.sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
    const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
    
    if (aRole !== bRole) return aRole - bRole;
    return b.engagement_score - a.engagement_score;
  });

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('community_id', communityId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Member role updated to ${newRole}`
      });

      onUpdate();
      setSelectedMember(null);
      setActionType(null);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from community"
      });

      onUpdate();
      setSelectedMember(null);
      setActionType(null);
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canManageMember = (member: CommunityMember) => {
    if (!isCurrentUserAdmin) return false;
    if (member.role === 'admin') return false; // Can't manage other admins
    return true;
  };

  const confirmAction = () => {
    if (!selectedMember || !actionType) return;

    switch (actionType) {
      case 'promote':
        handleRoleChange(selectedMember.user_id, 'admin');
        break;
      case 'demote':
        handleRoleChange(selectedMember.user_id, 'member');
        break;
      case 'remove':
        handleRemoveMember(selectedMember.user_id);
        break;
    }
  };

  const getActionDescription = () => {
    if (!selectedMember || !actionType) return '';

    const memberName = getDisplayName(selectedMember);
    switch (actionType) {
      case 'promote':
        return `Are you sure you want to promote ${memberName} to admin? They will have full management permissions.`;
      case 'demote':
        return `Are you sure you want to demote ${memberName} to regular member?`;
      case 'remove':
        return `Are you sure you want to remove ${memberName} from the community? They will lose access immediately.`;
      default:
        return '';
    }
  };

  if (!isCurrentUserAdmin) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {compact ? (
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Users className="h-3 w-3" />
            </Button>
          ) : (
            <Button variant="outline" size="lg" className="min-w-[140px]">
              <Users className="h-4 w-4 mr-2" />
              Manage Members
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Community Members</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold">{members.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{members.filter(m => m.role === 'admin').length}</div>
                <div className="text-xs text-muted-foreground">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{members.filter(m => m.role === 'moderator').length}</div>
                <div className="text-xs text-muted-foreground">Moderators</div>
              </div>
            </div>

            {/* Members List */}
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-2">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.profile_picture_url} />
                      <AvatarFallback className="text-sm">
                        {getUserInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {getDisplayName(member)}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRoleColor(member.role)}`}
                        >
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">{member.role}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score: {member.engagement_score} • Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>

                    {canManageMember(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === 'member' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member);
                                setActionType('promote');
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}
                          {member.role === 'moderator' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member);
                                setActionType('demote');
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Demote to Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('remove');
                            }}
                            className="text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedMember && !!actionType} onOpenChange={() => {
        setSelectedMember(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' && 'Promote Member'}
              {actionType === 'demote' && 'Demote Member'}
              {actionType === 'remove' && 'Remove Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              disabled={loading}
              className={actionType === 'remove' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageMembersDialog;