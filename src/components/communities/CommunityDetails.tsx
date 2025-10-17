import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Calendar,
  Tag,
  Crown,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { CommunityDetails as CommunityDetailsType } from '@/hooks/useCommunityDetails';
import { formatDistanceToNow } from 'date-fns';

interface CommunityDetailsProps {
  community: CommunityDetailsType;
  onJoin: () => void;
  joining: boolean;
  showLeaveDialog: boolean;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
}

const CommunityDetails: React.FC<CommunityDetailsProps> = ({
  community,
  onJoin,
  joining,
  showLeaveDialog,
  onConfirmLeave,
  onCancelLeave
}) => {
  const formatJoinedDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-3xl font-bold break-words">{community.name}</CardTitle>
            {community.isCreatedByUser && (
              <Badge variant="secondary" className="mt-2">
                <Crown className="h-3 w-3 mr-1" />
                Your Community
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Button
            onClick={onJoin}
            disabled={joining}
            variant={community.isUserMember ? "outline" : "default"}
            className="w-full"
          >
            {joining ? (
              "Processing..."
            ) : community.isUserMember ? (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Leave Community
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Join Community
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="font-medium mb-2">About</h3>
          <p className="text-muted-foreground leading-relaxed">
            {community.description}
          </p>
        </div>

        <Separator />

        {/* Community Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-lg font-semibold">{community.members.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium">
              {community.lastActivity ? 
                formatJoinedDate(community.lastActivity) : 
                'No activity'
              }
            </div>
            <div className="text-xs text-muted-foreground">Last Activity</div>
          </div>
        </div>

        <Separator />

        {/* Tags */}
        {community.tags.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {community.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Member Status */}
        {community.isUserMember && (
          <>
            <Separator />
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
                <Users className="h-4 w-4" />
                You're a member
              </div>
              <p className="text-xs text-muted-foreground">
                Role: <span className="capitalize font-medium">{community.userRole}</span>
              </p>
            </div>
          </>
        )}

        {/* Community Guidelines */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-medium mb-2 text-sm">Community Guidelines</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Be respectful and kind to all community members</li>
            <li>• Keep discussions relevant to the community topic</li>
            <li>• No spam, harassment, or inappropriate content</li>
            <li>• Help create a welcoming environment for everyone</li>
          </ul>
        </div>
      </CardContent>

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
    </Card>
  );
};

export default CommunityDetails;