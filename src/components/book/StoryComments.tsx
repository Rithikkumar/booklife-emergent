import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  commenter_id: string;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

interface StoryCommentsProps {
  bookId: string;
  allowedUserIds?: string[];
}

const StoryComments: React.FC<StoryCommentsProps> = ({ bookId, allowedUserIds }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Check if current user is allowed to comment (must be a book owner)
  const canComment = currentUserId && (!allowedUserIds || allowedUserIds.length === 0 || allowedUserIds.includes(currentUserId));

  useEffect(() => {
    fetchComments();
    getCurrentUser();
  }, [bookId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('book_story_comments')
        .select('id, comment, created_at, commenter_id')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(comment => comment.commenter_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine comments with profiles
      const commentsWithProfiles = data?.map(comment => {
        const profile = profiles?.find(p => p.user_id === comment.commenter_id);
        return {
          ...comment,
          profiles: {
            username: profile?.username || 'unknown',
            display_name: profile?.display_name || null,
          },
        };
      }) || [];

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('book_story_comments')
        .insert({
          book_id: bookId,
          commenter_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('book_story_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-1/4" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Link to={`/profile/${comment.profiles.username}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                  {(comment.profiles.display_name || comment.profiles.username)[0].toUpperCase()}
                </div>
              </Link>
              
              <div className="flex-1">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Link 
                      to={`/profile/${comment.profiles.username}`}
                      className="font-medium text-sm text-foreground hover:text-primary"
                    >
                      {comment.profiles.display_name || comment.profiles.username}
                    </Link>
                    <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground" title={formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}>
                    {format(new Date(comment.created_at), 'MMM d, yyyy')}
                  </span>
                      {currentUserId === comment.commenter_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{comment.comment}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add comment form - only for book owners */}
      {currentUserId && canComment && (
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
            ?
          </div>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this story..."
              className="min-h-[60px] resize-none"
              disabled={submitting}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {currentUserId && !canComment && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Only book owners can comment on this story
        </p>
      )}

      {!currentUserId && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Please sign in to join the conversation
        </p>
      )}
    </div>
  );
};

export default StoryComments;