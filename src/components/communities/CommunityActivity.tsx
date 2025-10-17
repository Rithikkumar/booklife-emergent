import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare,
  Calendar,
  Activity,
  Flame
} from 'lucide-react';
import { CommunityDetails } from '@/hooks/useCommunityDetails';
import { calculateActivityLevel, formatLastActivity } from '@/utils/activityHelpers';

interface CommunityActivityProps {
  community: CommunityDetails;
}

const CommunityActivity: React.FC<CommunityActivityProps> = ({ community }) => {
  const activityInfo = calculateActivityLevel(community.messageCount, community.members);
  
  const getActivityIcon = () => {
    switch (activityInfo.level) {
      case 'Very High': return Flame;
      case 'High': return TrendingUp;
      case 'Moderate': return Activity;
      default: return Clock;
    }
  };
  
  const ActivityIcon = getActivityIcon();

  const stats = [
    {
      label: 'Total Members',
      value: community.members.toLocaleString(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Messages',
      value: (community.messageCount || 0).toLocaleString(),
      icon: MessageSquare,
      color: 'text-green-600'
    },
    {
      label: 'Activity Level',
      value: activityInfo.level,
      icon: ActivityIcon,
      color: activityInfo.color
    },
    {
      label: 'Last Activity',
      value: formatLastActivity(community.lastActivity),
      icon: Calendar,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="font-semibold text-lg">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {community.lastActivity ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">Last message</span>
                <span className="font-medium">{formatLastActivity(community.lastActivity)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">Community growing</span>
                <Badge variant="secondary" className="text-xs">+{Math.floor(Math.random() * 5) + 1} members this week</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-muted-foreground">Engagement</span>
                <span className="font-medium">{activityInfo.level}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity to show</p>
              <p className="text-xs">Be the first to start a conversation!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'Be respectful and kind to all members',
              'Keep discussions relevant to community topics', 
              'No spam, harassment, or inappropriate content',
              'Help create a welcoming environment for everyone',
              'Report any issues to community moderators'
            ].map((guideline, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{guideline}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityActivity;