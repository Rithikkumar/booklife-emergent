import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ClassFilterType = 
  | 'trending'
  | 'live-now'
  | 'writing'
  | 'analysis'
  | 'publishing'
  | 'discussion'
  | 'creative'
  | 'literature'
  | 'fiction'
  | 'non-fiction'
  | 'mystery'
  | 'romance'
  | 'science-fiction'
  | 'fantasy'
  | 'thriller'
  | 'historical-fiction'
  | 'biography'
  | 'self-help'
  | 'young-adult'
  | 'children'
  | 'horror'
  | 'adventure'
  | 'poetry'
  | 'drama'
  | 'philosophy'
  | 'psychology';

interface BookClass {
  id: string;
  title: string;
  description: string;
  book_title: string;
  book_author: string;
  book_cover_url: string;
  category: string;
  tags: string[];
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  platform: string;
  platform_join_url: string;
  status: string;
  host_name: string;
  host_username: string;
  participant_count: number;
  is_ongoing: boolean;
  minutes_since_start: number;
}

export const useBookClassesSearch = () => {
  const [classes, setClasses] = useState<BookClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ClassFilterType[]>([]);

  const fetchClasses = useCallback(async (query: string = '', filters: ClassFilterType[] = []) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_live_book_classes', {
        search_query: query.trim() || null,
        filter_categories: filters.length > 0 ? filters : null,
        include_upcoming: true
      });

      if (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes');
        toast.error('Failed to load classes');
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses(searchQuery, activeFilters);
    
    // Listen for custom class creation events
    const handleClassCreated = () => {
      fetchClasses(searchQuery, activeFilters);
    };
    
    window.addEventListener('classCreated', handleClassCreated);
    
    return () => {
      window.removeEventListener('classCreated', handleClassCreated);
    };
  }, [fetchClasses, searchQuery, activeFilters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterToggle = (filter: ClassFilterType) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      } else {
        return [...prev, filter];
      }
    });
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  const refreshClasses = useCallback(() => {
    fetchClasses(searchQuery, activeFilters);
  }, [fetchClasses, searchQuery, activeFilters]);

  return {
    classes,
    loading,
    error,
    searchQuery,
    activeFilters,
    handleSearch,
    handleFilterToggle,
    clearFilters,
    refreshClasses
  };
};