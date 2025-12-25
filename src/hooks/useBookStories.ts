import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BookStory {
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

interface BookStoriesResult {
  stories: BookStory[];
  ownerUserIds: string[];
  loading: boolean;
  error: string | null;
}

export const useBookStories = (bookTitle?: string, bookAuthor?: string): BookStoriesResult => {
  const [stories, setStories] = useState<BookStory[]>([]);
  const [ownerUserIds, setOwnerUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookTitle || !bookAuthor) {
      setLoading(false);
      return;
    }

    fetchBookStories();
  }, [bookTitle, bookAuthor]);

  const fetchBookStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_books')
        .select(`
          id,
          title,
          author,
          city,
          neighborhood,
          formatted_address,
          notes,
          created_at,
          updated_at,
          is_edited,
          edited_at,
          user_id
        `)
        .eq('title', bookTitle!)
        .eq('author', bookAuthor!)
        .not('notes', 'is', null)
        .neq('notes', '')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch profiles for all users
      const userIds = data?.map(book => book.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine book data with profiles
      const storiesWithProfiles = data?.map(book => {
        const profile = profiles?.find(p => p.user_id === book.user_id);
        const location = book.neighborhood || book.city || 'Unknown';
        const formattedLocation = book.neighborhood && book.city ? 
          `${book.neighborhood}, ${book.city}` : location;
        
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          city: formattedLocation,
          notes: book.notes || '',
          created_at: book.created_at,
          updated_at: book.updated_at,
          is_edited: book.is_edited,
          edited_at: book.edited_at,
          user_id: book.user_id,
          profile: {
            username: profile?.username || 'unknown',
            display_name: profile?.display_name || null,
          },
        };
      }) || [];

      setStories(storiesWithProfiles);
      
      // Extract unique owner user IDs (all users who have ever owned this book)
      const uniqueOwnerIds = [...new Set(data?.map(book => book.user_id).filter(Boolean) as string[])];
      setOwnerUserIds(uniqueOwnerIds);
    } catch (err) {
      console.error('Error fetching book stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch book stories');
    } finally {
      setLoading(false);
    }
  };

  return { stories, ownerUserIds, loading, error };
};