import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BookClass {
  id: string;
  title: string;
  description: string | null;
  book_title: string | null;
  book_author: string | null;
  book_cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  max_participants: number | null;
  platform: string;
  platform_join_url: string | null;
  status: string | null;
  host_name: string | null;
  host_username: string | null;
  host_user_id: string | null;
  participant_count: number;
  created_at: string;
  show_participant_count: boolean;
}

export const useAllBookClasses = () => {
  const [classes, setClasses] = useState<BookClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClasses = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_all_book_classes', {
          search_query: search || null,
          filter_categories: null
        });

      if (fetchError) throw fetchError;

      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching all classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses(searchQuery);

    // Listen for class creation/update events
    const handleClassCreated = () => {
      fetchClasses(searchQuery);
    };

    window.addEventListener('classCreated', handleClassCreated);
    window.addEventListener('classJoined', handleClassCreated);
    return () => {
      window.removeEventListener('classCreated', handleClassCreated);
      window.removeEventListener('classJoined', handleClassCreated);
    };
  }, [fetchClasses, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const refreshClasses = () => {
    fetchClasses(searchQuery);
  };

  return {
    classes,
    loading,
    error,
    searchQuery,
    handleSearch,
    refreshClasses
  };
};
