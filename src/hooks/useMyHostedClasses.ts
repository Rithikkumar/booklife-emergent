import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HostedClass {
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
  participant_count: number;
  created_at: string;
}

export const useMyHostedClasses = () => {
  const [classes, setClasses] = useState<HostedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHostedClasses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // Fetch classes created by the current user
      const { data: hostedClasses, error: classesError } = await supabase
        .from('book_classes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Get participant counts for each class
      const classIds = hostedClasses?.map(c => c.id) || [];
      
      let participantCounts: Record<string, number> = {};
      if (classIds.length > 0) {
        const { data: participants } = await supabase
          .from('class_participants')
          .select('class_id')
          .in('class_id', classIds);
        
        if (participants) {
          participantCounts = participants.reduce((acc, p) => {
            acc[p.class_id] = (acc[p.class_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const classesWithCounts: HostedClass[] = (hostedClasses || []).map(c => ({
        ...c,
        participant_count: participantCounts[c.id] || 0
      }));

      setClasses(classesWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching hosted classes:', err);
      setError('Failed to load your hosted classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostedClasses();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchHostedClasses();
    });

    // Listen for class creation events
    const handleClassCreated = () => fetchHostedClasses();
    window.addEventListener('classCreated', handleClassCreated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('classCreated', handleClassCreated);
    };
  }, [fetchHostedClasses]);

  return {
    classes,
    loading,
    error,
    refreshClasses: fetchHostedClasses
  };
};
