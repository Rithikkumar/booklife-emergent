import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Globe,
  Settings
} from 'lucide-react';
import { CommunityDetails as CommunityDetailsType } from '@/hooks/useCommunityDetails';
import { CommunityMember } from '@/hooks/useCommunityChat';
import TagList from '@/components/common/TagList';
import { calculateActivityLevel, formatLastActivity, formatActivityTime } from '@/utils/activityHelpers';
import { useCommunityAdmin } from '@/hooks/useCommunityAdmin';
import EditCommunityDialog from './EditCommunityDialog';
import ManageMembersDialog from './ManageMembersDialog';

interface CommunityHeaderProps {
  community: CommunityDetailsType;
  members: CommunityMember[];
  onJoin: () => void;
  joining: boolean;
  showLeaveDialog: boolean;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  onUpdate: () => void;
  joinRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  members,
  onJoin,
  joining,
  showLeaveDialog,
  onConfirmLeave,
  onCancelLeave,
  onUpdate
}) => {
  const activityInfo = calculateActivityLevel(community.messageCount, community.members);
  const { isAdmin } = useCommunityAdmin(community.id);

  const getCommunityInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Community Avatar */}
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                {getCommunityInitials(community.name)}
              </AvatarFallback>
            </Avatar>

            {/* Community Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">
                  {community.name}
                </h1>
                {community.isCreatedByUser && (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                )}
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed max-w-2xl">
                {community.description}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{community.members.toLocaleString()}</span>
                  <span>members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">{community.messageCount || 0}</span>
                  <span>messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Last active {formatActivityTime(community.lastActivity)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-4 w-4 ${activityInfo.color}`} />
                  <span className={activityInfo.color}>Activity Level: {activityInfo.level}</span>
                </div>
              </div>

              {/* Tags */}
              {community.tags.length > 0 && (
                <TagList tags={community.tags} variant="secondary" className="mb-4" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                {/* Admin Controls - Always show with consistent sizing */}
                {isAdmin && (
                  <>
                    <EditCommunityDialog 
                      community={community} 
                      onUpdate={onUpdate} 
                    />
                    <ManageMembersDialog
                      members={members}
                      communityId={community.id}
                      currentUserRole={community.userRole || 'member'}
                      onUpdate={onUpdate}
                    />
                  </>
                )}
                
                {/* Join/Leave Button */}
                <Button
                  onClick={onJoin}
                  disabled={joining}
                  variant={community.isUserMember ? "outline" : "default"}
                  size="lg"
                  className="w-full md:w-auto min-w-[140px]"
                >
                  {joining ? (
                    "Processing..."
                  ) : community.isUserMember ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Leave
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Member Status Banner */}
          {community.isUserMember && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                <span className="font-medium text-sm">
                  You're a {community.userRole} of this community
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Leave Community Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={onCancelLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Community</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <span className="font-semibold">{community.name}</span>? 
              You will no longer have access to community discussions and will need to rejoin to participate again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Leave Community
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommunityHeader;