import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTotalBooksCount = () => {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalCount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get count of unique books (title + author combination)
      const { data, error } = await supabase
        .from('user_books')
        .select('title, author')
        .throwOnError();

      if (error) {
        throw error;
      }

      // Count unique title+author combinations
      const uniqueBooks = new Set();
      data?.forEach(book => {
        const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
        uniqueBooks.add(key);
      });

      setTotalCount(uniqueBooks.size);
    } catch (err) {
      console.error('Error fetching total books count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch total count');
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();
  }, []);

  return {
    totalCount,
    loading,
    error,
    refetch: fetchTotalCount
  };
};