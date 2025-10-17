import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Upload, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CommunityDetails } from '@/hooks/useCommunityDetails';
import ImageUpload from '@/components/common/ImageUpload';

interface EditCommunityDialogProps {
  community: CommunityDetails;
  onUpdate: () => void;
}

const EditCommunityDialog: React.FC<EditCommunityDialogProps> = ({ community, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description,
    tags: community.tags,
    profile_picture_url: '',
    is_public: community.is_public,
    restrict_messaging: community.restrict_messaging || false
  });
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (open && !initializedRef.current) {
      // Only initialize form data once when dialog opens
      setFormData({
        name: community.name,
        description: community.description,
        tags: community.tags,
        profile_picture_url: '',
        is_public: community.is_public,
        restrict_messaging: community.restrict_messaging || false
      });
      initializedRef.current = true;
    } else if (!open) {
      // Reset the flag when dialog closes
      initializedRef.current = false;
    }
  }, [open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Community name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
        is_public: formData.is_public,
        restrict_messaging: formData.restrict_messaging
      };

      const { error } = await supabase
        .from('communities')
        .update(updateData)
        .eq('id', community.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Community updated successfully"
      });

      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error updating community:', error);
      toast({
        title: "Error",
        description: "Failed to update community",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getCommunityInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="min-w-[140px]">
          <Settings className="h-4 w-4 mr-2" />
          Edit Community
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Community</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Community Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.profile_picture_url} />
              <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">
                {getCommunityInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label className="text-sm font-medium">Community Avatar</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a profile picture for your community
              </p>
              <ImageUpload
                label=""
                value={formData.profile_picture_url}
                onChange={(file, url) => setFormData(prev => ({ ...prev, profile_picture_url: url }))}
                variant="profile"
                maxSize={2}
              />
            </div>
          </div>

          {/* Community Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter community name"
              maxLength={100}
            />
          </div>

          {/* Community Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your community..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                maxLength={30}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Setting */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Community Privacy</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formData.is_public ? 'Public Community' : 'Private Community'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.is_public 
                    ? "Anyone can join this community immediately"
                    : "Users must request to join and be approved by an admin"
                  }
                </p>
              </div>
              <Switch
                checked={!formData.is_public}
                onCheckedChange={(checked) => {
                  console.log('Privacy toggle changed:', { checked, newIsPublic: !checked });
                  setFormData(prev => ({ ...prev, is_public: !checked }));
                }}
              />
            </div>
          </div>

          {/* Messaging Restrictions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Messaging Permissions</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formData.restrict_messaging ? 'Restricted Messaging' : 'Open Messaging'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.restrict_messaging 
                    ? "Only community owners and admins can send messages"
                    : "All community members can send messages"
                  }
                </p>
              </div>
              <Switch
                checked={formData.restrict_messaging}
                onCheckedChange={(checked) => {
                  console.log('Messaging toggle changed:', { checked });
                  setFormData(prev => ({ ...prev, restrict_messaging: checked }));
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommunityDialog;