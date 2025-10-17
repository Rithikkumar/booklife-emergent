
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, ArrowRight, Globe, Lock, Check } from "lucide-react";
import { Community } from '@/types';
import ActionButton from '@/components/common/ActionButton';
import IconText from '@/components/common/IconText';
import TagList from '@/components/common/TagList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommunityCardProps {
  community: Community;
  onJoin?: (communityId: string) => void;
  onViewDetails?: (communityId: string) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community, 
  onJoin, 
  onViewDetails 
}) => {
  return (
    <Card className="w-full shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer"
          onClick={() => onViewDetails?.(community.id)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold hover:text-primary transition-colors truncate">
                {community.name}
              </h3>
              {community.is_public ? (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            {!community.is_public && (
              <Badge variant="secondary" className="text-xs mb-2">
                Private Community
              </Badge>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground mt-1 gap-1 sm:gap-4">
              <IconText 
                icon={Users} 
                text={`${community.members.toLocaleString()} members`}
                className="flex-shrink-0"
              />
              <IconText 
                icon={MessageCircle} 
                text={`Active ${community.recentActivity}`}
                className="flex-shrink-0"
              />
            </div>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            {community.isJoined ? (
              <ActionButton
                variant="outline"
                size="sm"
                disabled={true}
                icon={Check}
                className="w-full sm:w-auto cursor-not-allowed border-2 border-primary text-primary bg-primary/15 hover:bg-primary/25 font-bold shadow-sm"
              >
                Joined
              </ActionButton>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ActionButton
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Join
                  </ActionButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Join Community</AlertDialogTitle>
                    <AlertDialogDescription>
                      Do you want to join the {community.name} community?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onJoin?.(community.id)}>
                      Yes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-4 line-clamp-2">{community.description}</p>
        <div onClick={(e) => e.stopPropagation()}>
          <TagList tags={community.tags} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityCard;
