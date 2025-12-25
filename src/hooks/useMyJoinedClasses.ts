import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JoinedClass {
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
  host_name: string;
  host_username: string;
  participant_count: number;
  joined_at: string;
}

export const useMyJoinedClasses = () => {
  const [classes, setClasses] = useState<JoinedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoinedClasses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // Fetch class participations
      const { data: participations, error: partError } = await supabase
        .from('class_participants')
        .select('class_id, joined_at')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const classIds = participations.map(p => p.class_id);

      // Fetch class details - exclude classes the user owns
      const { data: classDetails, error: classError } = await supabase
        .from('book_classes')
        .select('*')
        .in('id', classIds)
        .neq('user_id', user.id);

      if (classError) throw classError;

      if (!classDetails || classDetails.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // Fetch host profiles
      const hostIds = [...new Set(classDetails.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', hostIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { display_name: string | null; username: string }>);

      // Get participant counts
      const { data: allParticipants } = await supabase
        .from('class_participants')
        .select('class_id')
        .in('class_id', classIds);

      const participantCounts = (allParticipants || []).reduce((acc, p) => {
        acc[p.class_id] = (acc[p.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Build joined_at map
      const joinedAtMap = participations.reduce((acc, p) => {
        acc[p.class_id] = p.joined_at || '';
        return acc;
      }, {} as Record<string, string>);

      const joinedClasses: JoinedClass[] = classDetails.map(c => {
        const host = profileMap[c.user_id];
        return {
          ...c,
          host_name: host?.display_name || host?.username || 'Unknown',
          host_username: host?.username || 'unknown',
          participant_count: participantCounts[c.id] || 0,
          joined_at: joinedAtMap[c.id] || ''
        };
      });

      setClasses(joinedClasses);
      setError(null);
    } catch (err) {
      console.error('Error fetching joined classes:', err);
      setError('Failed to load joined classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoinedClasses();

    // Listen for class joined events
    const handleClassJoined = () => {
      fetchJoinedClasses();
    };
    window.addEventListener('classJoined', handleClassJoined);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchJoinedClasses();
    });

    return () => {
      window.removeEventListener('classJoined', handleClassJoined);
      subscription.unsubscribe();
    };
  }, [fetchJoinedClasses]);

  return {
    classes,
    loading,
    error,
    refreshClasses: fetchJoinedClasses
  };
};
