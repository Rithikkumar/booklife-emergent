import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FollowedBook {
  id: string;
  book_title: string;
  book_author: string;
  followed_at: string;
  notification_enabled: boolean;
}

export const useFollowingBooks = () => {
  const [followedBooks, setFollowedBooks] = useState<FollowedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowedBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFollowedBooks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('followed_books')
        .select('*')
        .eq('user_id', user.id)
        .order('followed_at', { ascending: false });

      if (error) throw error;
      setFollowedBooks(data || []);
    } catch (error) {
      console.error('Error fetching followed books:', error);
      toast.error('Failed to load following journeys');
    } finally {
      setLoading(false);
    }
  };

  const isBookFollowed = (title: string, author: string) => {
    return followedBooks.some(book => 
      book.book_title === title && book.book_author === author
    );
  };

  const followBook = async (title: string, author: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to follow book journeys');
        return false;
      }

      // Check if already following
      if (isBookFollowed(title, author)) {
        toast.info('Already following this book journey');
        return true;
      }

      const { data, error } = await supabase
        .from('followed_books')
        .insert({
          user_id: user.id,
          book_title: title,
          book_author: author,
          notification_enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      setFollowedBooks(prev => [data, ...prev]);
      toast.success('Now following this book\'s journey!');
      return true;
    } catch (error) {
      console.error('Error following book:', error);
      toast.error('Failed to follow book journey');
      return false;
    }
  };

  const unfollowBook = async (title: string, author: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('followed_books')
        .delete()
        .eq('user_id', user.id)
        .eq('book_title', title)
        .eq('book_author', author);

      if (error) throw error;

      setFollowedBooks(prev => 
        prev.filter(book => !(book.book_title === title && book.book_author === author))
      );
      toast.success('Unfollowed book journey');
      return true;
    } catch (error) {
      console.error('Error unfollowing book:', error);
      toast.error('Failed to unfollow book journey');
      return false;
    }
  };

  const toggleFollow = async (title: string, author: string) => {
    const isFollowing = isBookFollowed(title, author);
    if (isFollowing) {
      return await unfollowBook(title, author);
    } else {
      return await followBook(title, author);
    }
  };

  useEffect(() => {
    fetchFollowedBooks();
  }, []);

  return {
    followedBooks,
    loading,
    isBookFollowed,
    followBook,
    unfollowBook,
    toggleFollow,
    refetch: fetchFollowedBooks
  };
};