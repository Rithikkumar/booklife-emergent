import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { CommunityMember } from '@/hooks/useCommunityChat';
import { formatDistanceToNow } from 'date-fns';

interface CommunityMembersGridProps {
  members: CommunityMember[];
  loading?: boolean;
}

const CommunityMembersGrid: React.FC<CommunityMembersGridProps> = ({ 
  members, 
  loading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const name = getDisplayName(member).toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Sort by role first (admin -> moderator -> member), then by engagement
      const roleOrder = { admin: 0, moderator: 1, member: 2 };
      const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
      const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
      
      if (aRole !== bRole) {
        return aRole - bRole;
      }
      
      return b.engagement_score - a.engagement_score;
    });

  const roleStats = {
    all: members.length,
    admin: members.filter(m => m.role === 'admin').length,
    moderator: members.filter(m => m.role === 'moderator').length,
    member: members.filter(m => m.role === 'member').length,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-24 mb-2" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            {Object.entries(roleStats).map(([role, count]) => (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(role)}
                className="capitalize"
              >
                {role === 'all' ? 'All' : role} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Members Grid */}
        <ScrollArea className="h-[500px]">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              <p className="text-xs">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.profile_picture_url} />
                      <AvatarFallback className="text-sm">
                        {getUserInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm truncate">
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
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>Score: {member.engagement_score}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatLastActive(member.last_active_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CommunityMembersGrid;