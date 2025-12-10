import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCommunityJoinRequests } from '@/hooks/useCommunityJoinRequests';

interface JoinRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

export const JoinRequestDialog = ({ 
  isOpen, 
  onClose, 
  communityId, 
  communityName 
}: JoinRequestDialogProps) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendJoinRequest } = useCommunityJoinRequests(communityId);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await sendJoinRequest(message);
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error sending join request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Join {communityName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is a private community. Send a request to the community admin and 
            they will review your application.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the admin why you'd like to join this community..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};