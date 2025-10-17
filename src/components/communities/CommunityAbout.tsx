import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  TrendingUp,
  Calendar,
  MessageSquare,
  Activity,
  Clock,
  Globe,
  Tag,
  ArrowRight
} from 'lucide-react';
import { CommunityDetails } from '@/hooks/useCommunityDetails';
import { CommunityMember } from '@/hooks/useCommunityChat';
import TagList from '@/components/common/TagList';
import CommunityStats from '@/components/communities/CommunityStats';
import { useCommunityAnalytics } from '@/hooks/useCommunityAnalytics';

interface CommunityAboutProps {
  community: CommunityDetails;
  members: CommunityMember[];
  membersLoading: boolean;
  onTabChange: (tab: string) => void;
}

const CommunityAbout: React.FC<CommunityAboutProps> = ({ 
  community, 
  members, 
  membersLoading,
  onTabChange 
}) => {
  const { analytics, loading: analyticsLoading } = useCommunityAnalytics(community.id);
  
  // Debug logging
  console.log('CommunityAbout analytics:', { analytics, loading: analyticsLoading });
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

  const activityInfo = analytics ? {
    level: analytics.activityLevel,
    color: analytics.activityColor
  } : { level: 'Low', color: 'text-gray-600' };

  // Sort members by role and engagement for preview
  const sortedMembers = [...members]
    .sort((a, b) => {
      const roleOrder = { admin: 0, moderator: 1, member: 2 };
      const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
      const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
      
      if (aRole !== bRole) return aRole - bRole;
      return b.engagement_score - a.engagement_score;
    })
    .slice(0, 8); // Show top 8 members

  const memberStats = {
    total: members.length,
    admins: members.filter(m => m.role === 'admin').length,
    moderators: members.filter(m => m.role === 'moderator').length,
    activeMembers: members.filter(m => m.engagement_score > 10).length
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="xl:col-span-2 space-y-6">
        {/* Community Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              About This Community
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {community.description}
            </p>
            
            {/* Tags */}
            {community.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Topics & Tags
                </h4>
                <TagList tags={community.tags} variant="secondary" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Statistics */}
        {analytics && !analyticsLoading ? (
          <CommunityStats 
            analytics={analytics} 
            loading={false} 
          />
        ) : (
          <CommunityStats 
            analytics={{
              memberCount: community.members || 0,
              messageCount: community.messageCount || 0,
              lastActivity: community.lastActivity,
              activeMembersCount: 0,
              recentMessagesCount: 0,
              activityLevel: 'Low' as const,
              activityColor: 'text-gray-600',
              activityDescription: 'Loading community data...'
            }} 
            loading={analyticsLoading} 
          />
        )}

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((community as any).guidelines || '1. Be respectful to all members\n2. No spam or self-promotion\n3. Stay on topic\n4. Help create a welcoming environment for everyone\n5. Report any issues to community moderators')
                .split('\n')
                .filter((line: string) => line.trim())
                .map((guideline: string, index: number) => {
                  // Remove numbering if present
                  const cleanedGuideline = guideline.replace(/^\d+\.\s*/, '').trim();
                  return (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{cleanedGuideline}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Right Side */}
      <div className="xl:col-span-1 space-y-6">
        {/* Member Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{memberStats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{memberStats.activeMembers}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-yellow-500/5 rounded border border-yellow-500/10">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Admins</span>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  {memberStats.admins}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-blue-500/5 rounded border border-blue-500/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Moderators</span>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                  {memberStats.moderators}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Members Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Members
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange('members')}
                className="text-xs"
              >
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="px-4 pb-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-20 mb-1" />
                      <div className="h-2 bg-muted rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="px-4 pb-4 space-y-2">
                  {sortedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
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
                            {getRoleIcon(member.role)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {member.engagement_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityAbout;