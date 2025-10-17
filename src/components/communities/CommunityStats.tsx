import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Activity,
  Clock
} from 'lucide-react';
import { CommunityAnalytics } from '@/hooks/useCommunityAnalytics';
import { formatActivityTime } from '@/utils/activityHelpers';

interface CommunityStatsProps {
  analytics: CommunityAnalytics | null;
  loading?: boolean;
}

const CommunityStats: React.FC<CommunityStatsProps> = ({ analytics, loading }) => {
  // Debug logging
  console.log('CommunityStats render:', { analytics, loading, analyticsType: typeof analytics });

  if (loading || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Community Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="h-6 w-6 mx-auto mb-2 bg-muted rounded" />
                <div className="h-6 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Double-check analytics is available before using - additional safety
  if (!analytics || typeof analytics.memberCount === 'undefined') {
    console.warn('Analytics data is invalid:', analytics);
    return null;
  }

  const stats = [
    {
      label: 'Total Members',
      value: analytics.memberCount.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/10'
    },
    {
      label: 'Messages',
      value: analytics.messageCount.toLocaleString(),
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-500/5',
      borderColor: 'border-green-500/10'
    },
    {
      label: 'Activity Level',
      value: analytics.activityLevel,
      icon: Activity,
      color: analytics.activityColor,
      bgColor: 'bg-purple-500/5',
      borderColor: 'border-purple-500/10'
    },
    {
      label: 'Last Active',
      value: formatActivityTime(analytics.lastActivity),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/5',
      borderColor: 'border-orange-500/10'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Community Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`text-center p-4 ${stat.bgColor} rounded-lg border ${stat.borderColor}`}
            >
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Additional Analytics */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active members (30 days):</span>
              <span className="font-medium">{analytics.activeMembersCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Recent messages (7 days):</span>
              <span className="font-medium">{analytics.recentMessagesCount}</span>
            </div>
          </div>
          
          <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
            <span className="font-medium">Activity Level:</span> {analytics.activityDescription}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityStats;