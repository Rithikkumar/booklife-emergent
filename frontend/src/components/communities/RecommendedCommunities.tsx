import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, TrendingUp, Users, MessageCircle, Star } from "lucide-react";
import { useCommunityRecommendations } from '@/hooks/useCommunityRecommendations';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ActionButton from '@/components/common/ActionButton';
import IconText from '@/components/common/IconText';
import TagList from '@/components/common/TagList';

interface RecommendedCommunitiesProps {
  onJoinCommunity?: (communityId: string) => void;
}

const RecommendedCommunities: React.FC<RecommendedCommunitiesProps> = ({ onJoinCommunity }) => {
  const { recommendations, loading, error, refreshRecommendations } = useCommunityRecommendations();

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getAlgorithmBadgeColor = (algorithm: string) => {
    if (algorithm.includes('content')) return 'bg-blue-100 text-blue-800';
    if (algorithm.includes('collaborative')) return 'bg-green-100 text-green-800';
    if (algorithm.includes('social')) return 'bg-purple-100 text-purple-800';
    if (algorithm.includes('activity')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Failed to load recommendations</p>
            <Button onClick={refreshRecommendations} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Recommended for You
          </CardTitle>
          <Button 
            onClick={refreshRecommendations} 
            variant="ghost" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No recommendations yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Join some communities and interact with books to get personalized recommendations!
            </p>
            <Button onClick={refreshRecommendations} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Recommendations
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.community_id} className="border rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow min-h-[120px]">
                <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2">
                  <h4 className="font-semibold text-sm flex-1 truncate pr-1">{rec.community.name}</h4>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-foreground" fill="currentColor" />
                      <span className="text-xs font-bold text-foreground">
                        {Math.round(rec.score * 100)}%
                      </span>
                    </div>
                    
                    <ActionButton
                      variant="primary"
                      size="sm"
                      onClick={() => onJoinCommunity?.(rec.community_id)}
                      className="text-xs px-2 py-1 flex-shrink-0"
                    >
                      Join
                    </ActionButton>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {rec.community.description.substring(0, 80)}...
                </p>

                {/* Recommendation reason */}
                {rec.reason && (
                  <div className="mb-3">
                    <p className="text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      💡 {rec.reason}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center text-xs text-muted-foreground gap-2 sm:gap-3">
                    <IconText 
                      icon={Users} 
                      text={`${rec.community.member_count.toLocaleString()}`}
                      className="flex-shrink-0"
                    />
                    <IconText 
                      icon={MessageCircle} 
                      text={`${rec.community.activity_score}%`}
                      className="flex-shrink-0"
                    />
                  </div>
                  <div className="w-full">
                    <TagList tags={rec.community.tags.slice(0, 3)} />
                  </div>
                  
                  {/* Algorithm badges */}
                  {rec.algorithm_type && (
                    <div className="flex flex-wrap gap-1">
                      {rec.algorithm_type.split(',').map((algo, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="text-xs py-0 px-1 h-5"
                        >
                          {algo.replace('_', ' ').trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {recommendations.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  +{recommendations.length - 5} more recommendations available
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedCommunities;