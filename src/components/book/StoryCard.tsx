import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, MessageCircle, Heart, Laugh, Zap, Frown, Edit, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StoryComments from './StoryComments';
import StoryReactions from './StoryReactions';

interface StoryEntry {
  id: string;
  title: string;
  author: string;
  city: string;
  notes: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  edited_at?: string;
  user_id?: string;
  profile: {
    username: string;
    display_name: string | null;
  };
}

interface StoryCardProps {
  bookId: string;
  entry: StoryEntry;
  showComments?: boolean;
}

// EditButton component for conditional rendering
const EditButton: React.FC<{ entryUserId?: string; onEdit: () => void }> = ({ entryUserId, onEdit }) => {
  const [canEdit, setCanEdit] = useState(false);

  React.useEffect(() => {
    const checkPermissions = async () => {
      if (!entryUserId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      setCanEdit(user?.id === entryUserId);
    };

    checkPermissions();
  }, [entryUserId]);

  if (!canEdit) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onEdit}
      className="text-muted-foreground hover:text-foreground"
    >
      <Edit className="h-3 w-3 mr-1" />
      Edit
    </Button>
  );
};

const StoryCard: React.FC<StoryCardProps> = ({ bookId, entry, showComments = false }) => {
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(entry.notes);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditStory = async () => {
    if (!editedNotes.trim()) {
      toast.error('Story cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_books')
        .update({ 
          notes: editedNotes.trim()
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast.success('Story updated successfully');
      setIsEditing(false);
      // Refresh the page to show updated story
      window.location.reload();
    } catch (error) {
      console.error('Error updating story:', error);
      toast.error('Failed to update story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedNotes(entry.notes);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link 
              to={`/profile/${entry.profile.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {(entry.profile.display_name || entry.profile.username)[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {entry.profile.display_name || entry.profile.username}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{entry.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Story content */}
        {entry.notes && (
          <div className="mb-4">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Share your story with this book..."
                  className="min-h-[100px] resize-none"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEditStory}
                    disabled={isLoading || !editedNotes.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <blockquote className="text-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4 bg-muted/30 p-4 rounded-r-lg">
                  "{entry.notes}"
                </blockquote>
                {/* Edit timestamp */}
                {entry.is_edited && entry.edited_at && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Last edited {formatDistanceToNow(new Date(entry.edited_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reactions and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-4 border-t border-border/50">
          <div className="flex-1 min-w-0">
            <StoryReactions bookId={bookId} />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit button - only show for story author */}
            {!isEditing && (
              <EditButton entryUserId={entry.user_id} onEdit={() => setIsEditing(true)} />
            )}
            
            {showComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentsSection(!showCommentsSection)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Comments</span>
                <span className="xs:hidden">💬</span>
              </Button>
            )}
          </div>
        </div>

        {/* Comments section */}
        {showComments && showCommentsSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border/50"
          >
            <StoryComments bookId={bookId} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StoryCard;