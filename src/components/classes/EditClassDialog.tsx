import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { CalendarIcon, Clock, Video, X, Link, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import BookSearchInput from "@/components/common/BookSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/components/common/FormValidation";

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: {
    id: string;
    title: string;
    description?: string | null;
    book_title?: string | null;
    book_author?: string | null;
    book_cover_url?: string | null;
    category?: string | null;
    tags?: string[] | null;
    scheduled_date?: string | null;
    duration_minutes?: number | null;
    max_participants?: number | null;
    platform?: string;
    platform_join_url?: string | null;
    show_participant_count?: boolean;
  };
  onSave?: () => void;
}

const EditClassDialog: React.FC<EditClassDialogProps> = ({ 
  open, 
  onOpenChange, 
  classData,
  onSave 
}) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
    showParticipantCount: true,
  });

  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; coverUrl?: string }>({ 
    title: "", 
    author: "" 
  });
  const [newTag, setNewTag] = useState('');

  // Initialize form data when classData changes
  useEffect(() => {
    if (classData && open) {
      const scheduledDate = classData.scheduled_date ? new Date(classData.scheduled_date) : undefined;
      const timeString = scheduledDate 
        ? `${scheduledDate.getUTCHours().toString().padStart(2, '0')}:${scheduledDate.getUTCMinutes().toString().padStart(2, '0')}`
        : '';

      setFormData({
        className: classData.title || '',
        description: classData.description || '',
        date: scheduledDate,
        time: timeString,
        duration: classData.duration_minutes?.toString() || '',
        maxParticipants: classData.max_participants?.toString() || '',
        category: classData.category || '',
        tags: classData.tags || [],
        platform: classData.platform || '',
        meetingLink: classData.platform_join_url || '',
        showParticipantCount: classData.show_participant_count ?? true,
      });
      setSelectedBook({
        title: classData.book_title || '',
        author: classData.book_author || '',
        coverUrl: classData.book_cover_url || undefined,
      });
    }
  }, [classData, open]);

  const platforms = [
    { id: 'zoom', name: 'Zoom' },
    { id: 'google_meet', name: 'Google Meet' },
    { id: 'webex', name: 'Cisco WebEx' },
    { id: 'youtube_live', name: 'YouTube Live' },
    { id: 'other', name: 'Other' }
  ];

  const categories = [
    'Creative Writing', 'Poetry', 'Fiction Analysis', 'Non-Fiction',
    'Classic Literature', 'Contemporary Literature', 'Book Reviews',
    'Publishing', 'Reading Strategies', 'Literary Criticism',
    'Storytelling', 'Character Development', 'World Building',
    'Writing Techniques', 'Book Discussion'
  ];

  const handleInputChange = (field: string, value: any) => {
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

  const handleSave = async () => {
    if (isSaving) return;

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
        description: "Please select a video platform.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.meetingLink?.trim()) {
      toast({
        title: "Meeting link required",
        description: "Please provide a meeting link.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('book_classes')
        .update({
          title: formData.className,
          description: formData.description,
          book_title: selectedBook.title || null,
          book_author: selectedBook.author || null,
          book_cover_url: selectedBook.coverUrl || null,
          category: formData.category || null,
          tags: formData.tags,
          scheduled_date: formData.date && formData.time 
            ? new Date(`${formData.date.toISOString().split('T')[0]}T${formData.time}:00.000Z`).toISOString()
            : null,
          duration_minutes: parseInt(formData.duration) || 60,
          max_participants: parseInt(formData.maxParticipants) || 20,
          platform: formData.platform,
          platform_join_url: formData.meetingLink,
          show_participant_count: formData.showParticipantCount,
        })
        .eq('id', classData.id);

      if (error) throw error;

      // Send update notification emails to all registered participants
      try {
        const { error: emailError } = await supabase.functions.invoke('send-class-email', {
          body: {
            type: 'update',
            classId: classData.id,
          },
        });

        if (emailError) {
          console.error('Failed to send update emails:', emailError);
          // Don't fail the save if email fails - just log it
        } else {
          console.log('Update notification emails sent successfully');
        }
      } catch (emailErr) {
        console.error('Error invoking send-class-email function:', emailErr);
      }

      toast({
        title: "Class updated!",
        description: "Your changes have been saved and participants have been notified.",
      });

      onOpenChange(false);
      onSave?.();
      window.dispatchEvent(new CustomEvent('classCreated'));
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast({
        title: "Error updating class",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Class Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Class Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Book */}
              <div>
                <Label>Book</Label>
                {selectedBook.title ? (
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedBook.coverUrl && (
                        <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-10 h-14 object-cover rounded" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{selectedBook.title}</p>
                        {selectedBook.author && <p className="text-xs text-muted-foreground">by {selectedBook.author}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedBook({ title: "", author: "" })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <BookSearchInput
                    placeholder="Search for a book..."
                    onBookSelect={(book) => setSelectedBook(book)}
                    initialTitle=""
                    initialAuthor=""
                  />
                )}
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">Add</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-2 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Platform */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Link className="h-4 w-4 mr-2" />
                Platform & Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meeting Link</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Date</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Time (UTC)</Label>
                  <TimePicker
                    value={formData.time}
                    onChange={(value) => handleInputChange('time', value)}
                  />
                </div>
                <div>
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  />
                </div>
              </div>

              {/* Show Participant Count Toggle */}
              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <Label htmlFor="editShowParticipantCount" className="cursor-pointer">Show participant count publicly</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    When enabled, the number of registered participants will be visible to everyone
                  </p>
                </div>
                <Switch
                  id="editShowParticipantCount"
                  checked={formData.showParticipantCount}
                  onCheckedChange={(checked) => handleInputChange('showParticipantCount', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassDialog;
