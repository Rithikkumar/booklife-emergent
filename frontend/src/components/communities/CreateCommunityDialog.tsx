import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Link, Users, Lock, Image, Copy, Check, Upload, Camera } from "lucide-react";
import ActionButton from '@/components/common/ActionButton';

interface CreateCommunityDialogProps {
  onCreateCommunity?: (communityData: any) => void;
}

const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({ onCreateCommunity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: null as File | null,
    coverImagePreview: '',
    rules: '',
    category: '',
    customCategory: '',
    isPrivate: false,
    allowInviteLinks: true,
    tags: [] as string[],
    currentTag: ''
  });

  const categories = [
    'General Discussion',
    'Classics',
    'Fiction',
    'Non-Fiction',
    'Fantasy',
    'Science Fiction',
    'Mystery & Thriller',
    'Romance',
    'Biography',
    'History',
    'Self-Help',
    'Poetry',
    'Young Adult',
    'Children\'s Books',
    'Academic',
    'Book Reviews',
    'Author Discussions',
    'Reading Challenges',
    'Book Trading',
    'Other'
  ];

  const generateShareableLink = () => {
    if (!formData.name) return '';
    const communitySlug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `https://booksharing.app/join/${communitySlug}-${Date.now().toString().slice(-4)}`;
  };

  const copyToClipboard = async () => {
    const link = generateShareableLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, coverImage: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, coverImagePreview: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ 
      ...prev, 
      coverImage: null, 
      coverImagePreview: '' 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCommunity = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      members: 1,
      tags: formData.tags,
      recentActivity: "Just now",
      isJoined: true,
      createdBy: 'currentUser',
      isCreatedByUser: true,
      isRecommended: false,
      coverImage: formData.coverImagePreview, // In real app, this would be uploaded to storage
      rules: formData.rules,
      category: formData.category === 'Other' ? formData.customCategory : formData.category,
      isPrivate: formData.isPrivate,
      allowInviteLinks: formData.allowInviteLinks,
      shareableLink: formData.allowInviteLinks ? generateShareableLink() : ''
    };
    
    onCreateCommunity?.(newCommunity);
    setIsOpen(false);
    setFormData({
      name: '',
      description: '',
      coverImage: null,
      coverImagePreview: '',
      rules: '',
      category: '',
      customCategory: '',
      isPrivate: false,
      allowInviteLinks: true,
      tags: [],
      currentTag: ''
    });
  };

  const addTag = () => {
    if (formData.currentTag.trim() && !formData.tags.includes(formData.currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.currentTag.trim()],
        currentTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ActionButton variant="primary" className="w-full" icon={Plus}>
          Create Community
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Users className="h-5 w-5 mr-2 text-primary" />
            Create New Community
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Upload - Now at the top */}
          <div className="space-y-3">
            <Label>Cover Image (Optional)</Label>
            {formData.coverImagePreview ? (
              <div className="relative">
                <img 
                  src={formData.coverImagePreview} 
                  alt="Cover preview" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-muted"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload cover image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="cover-upload" className="cursor-pointer">
                      <Camera className="h-4 w-4 mr-2" />
                      Choose from device
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Community Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Community Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter community name..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your community..."
              rows={3}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {formData.category === 'Other' && (
              <div className="mt-2">
                <Input
                  value={formData.customCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                  placeholder="Enter custom category..."
                  required
                />
              </div>
            )}
          </div>

          {/* Community Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Community Rules (Optional)</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Stay on topic..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Set clear guidelines for your community members
            </p>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="private">Private Community</Label>
              </div>
              <Switch
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Private communities require approval to join
            </p>
          </div>

          {/* Invite Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="inviteLinks">Allow Invite Links</Label>
              </div>
              <Switch
                id="inviteLinks"
                checked={formData.allowInviteLinks}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowInviteLinks: checked }))}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Members can generate shareable invite links
            </p>
            
            {/* Shareable Link Preview */}
            {formData.allowInviteLinks && formData.name && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Shareable Link Preview:</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input 
                    value={generateShareableLink()} 
                    readOnly 
                    className="text-sm bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This link will be generated when you create the community
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                value={formData.currentTag}
                onChange={(e) => setFormData(prev => ({ ...prev, currentTag: e.target.value }))}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Add tags to help people discover your community
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary hover:shadow-glow">
              Create Community
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityDialog;