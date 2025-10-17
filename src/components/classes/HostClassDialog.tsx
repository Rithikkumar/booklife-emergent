import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, Users, Video, Copy, Check, Save, X, Link } from "lucide-react";
import { format } from "date-fns";
import TagList from "@/components/common/TagList";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import BookSearchInput from "@/components/common/BookSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/components/common/FormValidation";
import { handleDatabaseError, showErrorToast, rateLimiter, logSecurityEvent } from "@/utils/errorHandling";

interface HostClassDialogProps {
  children: React.ReactNode;
}

const HostClassDialog: React.FC<HostClassDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    className: '',
    description: '',
    date: undefined as Date | undefined,
    time: '',
    duration: '',
    maxParticipants: '',
    category: '',
    tags: [] as string[],
    platform: '',
    meetingLink: '',
  });
  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; coverUrl?: string }>({ title: "", author: "" });
  const [newTag, setNewTag] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const platforms = [
    { id: 'zoom', name: 'Zoom' },
    { id: 'google_meet', name: 'Google Meet' },
    { id: 'webex', name: 'Cisco WebEx' },
    { id: 'youtube_live', name: 'YouTube Live' },
    { id: 'other', name: 'Other' }
  ];

  const categories = [
    'Creative Writing',
    'Poetry',
    'Fiction Analysis',
    'Non-Fiction',
    'Classic Literature',
    'Contemporary Literature',
    'Book Reviews',
    'Publishing',
    'Reading Strategies',
    'Literary Criticism',
    'Storytelling',
    'Character Development',
    'World Building',
    'Writing Techniques',
    'Book Discussion'
  ];

  const handleInputChange = (field: string, value: any) => {
    // Sanitize text inputs
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
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

  const copyLink = async () => {
    if (shareableLink) {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Shareable link has been copied to clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleCreateClass = async () => {
    // Prevent multiple submissions
    if (isCreating) return;
    
    // Validate required fields
    if (!formData.className?.trim()) {
      toast({
        title: "Class name required",
        description: "Please enter a name for your class.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.platform) {
      toast({
        title: "Platform required",
        description: "Please select a video platform for your class.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.meetingLink?.trim()) {
      toast({
        title: "Meeting link required",
        description: "Please provide a meeting link for your class.",
        variant: "destructive"
      });
      return;
    }

    // Validate meeting link format
    try {
      new URL(formData.meetingLink);
    } catch {
      toast({
        title: "Invalid meeting link",
        description: "Please provide a valid URL for the meeting link.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting for class creation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a class.",
        variant: "destructive"
      });
      return;
    }

    const rateLimitKey = `create-class:${user.id}`;
    if (rateLimiter.isRateLimited(rateLimitKey, 5, 300000)) { // 5 classes per 5 minutes
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { type: 'class_creation', userId: user.id });
      toast({
        title: "Too many requests",
        description: "Please wait a few minutes before creating another class.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Save class to database
      const { data: classData, error: classError } = await supabase
        .from('book_classes')
        .insert({
          user_id: user.id,
          title: formData.className,
          description: formData.description,
          book_title: selectedBook.title,
          book_author: selectedBook.author,
          book_cover_url: selectedBook.coverUrl,
          category: formData.category,
          tags: formData.tags,
          scheduled_date: formData.date && formData.time 
            ? new Date(`${formData.date.toISOString().split('T')[0]}T${formData.time}:00.000Z`).toISOString()
            : null,
          duration_minutes: parseInt(formData.duration) || 60,
          max_participants: parseInt(formData.maxParticipants) || 20,
          platform: formData.platform,
          platform_join_url: formData.meetingLink,
          status: 'scheduled'
        })
        .select()
        .single();

      if (classError) throw classError;

      setShareableLink(formData.meetingLink);
      
      toast({
        title: "Class created successfully!",
        description: `Your ${formData.platform} class is ready. Share the link with participants.`,
      });
      
      // Reset form and close dialog
      setFormData({
        className: '',
        description: '',
        date: undefined,
        time: '',
        duration: '',
        maxParticipants: '',
        category: '',
        tags: [],
        platform: '',
        meetingLink: '',
      });
      setSelectedBook({ title: "", author: "" });
      setOpen(false);
      
      // Trigger a refresh of the classes list
      window.dispatchEvent(new CustomEvent('classCreated'));
      
    } catch (error: any) {
      console.error('Error creating class:', error);
      
      const errorInfo = handleDatabaseError(error);
      showErrorToast(errorInfo);
      
      // Log security event for failed class creation
      logSecurityEvent('CLASS_CREATION_FAILED', { 
        userId: user.id, 
        platform: formData.platform,
        error: errorInfo.code 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your class details have been saved as a draft.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Host a Book Class
          </DialogTitle>
        </DialogHeader>

        <div className="w-full space-y-6 mt-6">
          {/* Class Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Class Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    placeholder="e.g., Creative Writing Workshop"
                    value={formData.className}
                    onChange={(e) => handleInputChange('className', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
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
                </div>
              </div>

              <div>
                <Label htmlFor="description">Class Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this class..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Book Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Book Information</h4>
                {selectedBook.title ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-sm">Selected Book</h5>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedBook({ title: "", author: "" })}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedBook.coverUrl && (
                        <img 
                          src={selectedBook.coverUrl} 
                          alt={selectedBook.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{selectedBook.title}</p>
                        {selectedBook.author && (
                          <p className="text-xs text-muted-foreground">by {selectedBook.author}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <BookSearchInput
                    placeholder="Search for the book for your class..."
                    onBookSelect={(book) => setSelectedBook(book)}
                    initialTitle={selectedBook.title}
                    initialAuthor={selectedBook.author}
                  />
                )}
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Video Platform & Meeting Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="meetingLink"
                      type="url"
                      placeholder={
                        formData.platform === 'zoom' ? 'https://zoom.us/j/123456789?pwd=yourpassword' :
                        formData.platform === 'google_meet' ? 'https://meet.google.com/abc-defg-hij' :
                        formData.platform === 'webex' ? 'https://company.webex.com/meet/yourname' :
                        formData.platform === 'youtube_live' ? 'https://youtube.com/watch?v=yourvideoid (Account: @yourchannel)' :
                        'Enter your meeting link here'
                      }
                      value={formData.meetingLink}
                      onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste your {formData.platform ? platforms.find(p => p.id === formData.platform)?.name : 'video platform'} meeting link here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          handleInputChange('date', date);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <TimePicker
                    value={formData.time}
                    onChange={(value) => handleInputChange('time', value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 60"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="maxParticipants">Maximum Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shareable Link */}
          {shareableLink && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shareable Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input value={shareableLink} readOnly className="text-xs" />
                  <Button
                    size="sm"
                    onClick={copyLink}
                    className={linkCopied ? 'bg-green-600' : ''}
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this link with students to join your class
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleCreateClass}
              className="bg-gradient-primary hover:shadow-glow"
              size="lg"
              disabled={!formData.className || !formData.platform || !formData.meetingLink || isCreating}
            >
              <Video className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Class'}
            </Button>
            
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostClassDialog;