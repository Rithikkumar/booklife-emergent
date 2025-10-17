import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Crown, Shield, User } from 'lucide-react';
import { CommunityMember } from '@/hooks/useCommunityChat';
import { formatDistanceToNow } from 'date-fns';

interface CommunityMembersListProps {
  members: CommunityMember[];
  loading?: boolean;
}

const CommunityMembersList: React.FC<CommunityMembersListProps> = ({ members, loading }) => {
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

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never active';
    return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-1" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort members by role (admin -> moderator -> member) and then by engagement
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
    const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
    
    if (aRole !== bRole) {
      return aRole - bRole;
    }
    
    return b.engagement_score - a.engagement_score;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 px-4">
          <div className="space-y-3 pb-4">
            {sortedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.profile_picture_url} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(member)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {getDisplayName(member)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleColor(member.role)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Score: {member.engagement_score}</span>
                    <span className="truncate">
                      {formatLastActive(member.last_active_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CommunityMembersList;