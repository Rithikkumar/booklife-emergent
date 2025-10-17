import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookStats {
  followersCount: number;
  totalComments: number;
  totalReactions: number;
  loading: boolean;
  error: string | null;
}

export const useBookStats = (bookTitle?: string, bookAuthor?: string): BookStats => {
  const [stats, setStats] = useState<BookStats>({
    followersCount: 0,
    totalComments: 0,
    totalReactions: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!bookTitle || !bookAuthor) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    fetchBookStats();
  }, [bookTitle, bookAuthor]);

  const fetchBookStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Get all book instances for this title/author combination
      const { data: bookInstances, error: booksError } = await supabase
        .from('user_books')
        .select('id')
        .eq('title', bookTitle!)
        .eq('author', bookAuthor!);

      if (booksError) throw booksError;

      const bookIds = bookInstances?.map(book => book.id) || [];

      // Fetch followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('followed_books')
        .select('*', { count: 'exact', head: true })
        .eq('book_title', bookTitle!)
        .eq('book_author', bookAuthor!);

      if (followersError) throw followersError;

      // Fetch comments count for all book instances
      let totalComments = 0;
      if (bookIds.length > 0) {
        const { count: commentsCount, error: commentsError } = await supabase
          .from('book_story_comments')
          .select('*', { count: 'exact', head: true })
          .in('book_id', bookIds);

        if (commentsError) throw commentsError;
        totalComments = commentsCount || 0;
      }

      // Fetch reactions count for all book instances
      let totalReactions = 0;
      if (bookIds.length > 0) {
        const { count: reactionsCount, error: reactionsError } = await supabase
          .from('book_story_reactions')
          .select('*', { count: 'exact', head: true })
          .in('book_id', bookIds);

        if (reactionsError) throw reactionsError;
        totalReactions = reactionsCount || 0;
      }

      setStats({
        followersCount: followersCount || 0,
        totalComments,
        totalReactions,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching book stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch book stats',
      }));
    }
  };

  return stats;
};