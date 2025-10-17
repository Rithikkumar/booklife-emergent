import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Check, X, Clock } from 'lucide-react';
import { useCommunityJoinRequests } from '@/hooks/useCommunityJoinRequests';
import { formatDistanceToNow } from 'date-fns';

interface ManageJoinRequestsDialogProps {
  communityId: string;
  communityName: string;
}

export const ManageJoinRequestsDialog = ({ 
  communityId, 
  communityName 
}: ManageJoinRequestsDialogProps) => {
  const { 
    joinRequests, 
    loading, 
    approveJoinRequest, 
    refreshJoinRequests 
  } = useCommunityJoinRequests(communityId);

  const handleApprove = async (requestId: string) => {
    await approveJoinRequest(requestId, true);
    refreshJoinRequests();
  };

  const handleReject = async (requestId: string) => {
    await approveJoinRequest(requestId, false);
    refreshJoinRequests();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Join Requests
          {joinRequests.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {joinRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Join Requests for {communityName}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading requests...</div>
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                All join requests have been processed or no new requests have been submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={request.user_profile?.profile_picture_url} 
                          alt={request.user_profile?.username || 'User'} 
                        />
                        <AvatarFallback>
                          {(request.user_profile?.display_name || request.user_profile?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.user_profile?.display_name || request.user_profile?.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.user_profile?.username || 'unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  
                  {request.message && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm">{request.message}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleApprove(request.id)}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleReject(request.id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};