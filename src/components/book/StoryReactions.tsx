import React, { useState, useEffect } from 'react';
import { Heart, Laugh, Zap, Frown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Reaction {
  id: string;
  reaction_type: string;
  user_id: string;
}

interface ReactionCount {
  type: string;
  count: number;
  hasReacted: boolean;
}

interface StoryReactionsProps {
  bookId: string;
}

const reactionIcons = {
  heart: Heart,
  laugh: Laugh,
  wow: Zap,
  sad: Frown,
  thumbsup: ThumbsUp,
};

const reactionLabels = {
  heart: 'Love',
  laugh: 'Funny',
  wow: 'Amazing',
  sad: 'Touching',
  thumbsup: 'Like',
};

const StoryReactions: React.FC<StoryReactionsProps> = ({ bookId }) => {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [bookId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('book_story_reactions')
        .select('*')
        .eq('book_id', bookId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Count reactions by type
      const reactionCounts = Object.keys(reactionIcons).map(type => {
        const typeReactions = data?.filter(r => r.reaction_type === type) || [];
        return {
          type,
          count: typeReactions.length,
          hasReacted: currentUserId ? typeReactions.some(r => r.user_id === currentUserId) : false,
        };
      });

      setReactions(reactionCounts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to react to stories');
      return;
    }

    setLoading(true);

    try {
      const clickedReaction = reactions.find(r => r.type === reactionType && r.hasReacted);
      const anyExistingReaction = reactions.find(r => r.hasReacted);

      if (clickedReaction) {
        // Toggle off - user clicked their current reaction
        const { error } = await supabase
          .from('book_story_reactions')
          .delete()
          .eq('book_id', bookId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // First remove any existing reaction by this user
        if (anyExistingReaction) {
          await supabase
            .from('book_story_reactions')
            .delete()
            .eq('book_id', bookId)
            .eq('user_id', user.id);
        }
        
        // Then add the new reaction
        const { error } = await supabase
          .from('book_story_reactions')
          .insert({
            book_id: bookId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
      }

      await fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {reactions.map(({ type, count, hasReacted }) => {
        const Icon = reactionIcons[type as keyof typeof reactionIcons];
        return (
          <motion.div
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={hasReacted ? "default" : "ghost"}
              size="sm"
              onClick={() => handleReaction(type)}
              disabled={loading}
              className={`gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 ${
                hasReacted 
                  ? 'bg-primary/10 text-primary border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {count > 0 && <span className="text-xs font-medium">{count}</span>}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StoryReactions;