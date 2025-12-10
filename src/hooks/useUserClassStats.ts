import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserClassStats {
  classesJoined: number;
  hoursLearned: number;
  hostedClasses: number;
  completedClasses: number;
}

export const useUserClassStats = () => {
  const [stats, setStats] = useState<UserClassStats>({
    classesJoined: 0,
    hoursLearned: 0,
    hostedClasses: 0,
    completedClasses: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get classes joined as participant
      const { data: participantClasses } = await supabase
        .from('class_participants')
        .select(`
          class_id,
          book_classes!inner(
            duration_minutes,
            status,
            scheduled_date
          )
        `)
        .eq('user_id', user.id);

      // Get classes hosted by user
      const { data: hostedClasses } = await supabase
        .from('book_classes')
        .select('duration_minutes, status, scheduled_date')
        .eq('user_id', user.id);

      const classesJoined = participantClasses?.length || 0;
      const hostedCount = hostedClasses?.length || 0;

      // Calculate hours learned from participated classes
      const hoursFromParticipation = participantClasses?.reduce((total, pc) => {
        const duration = pc.book_classes?.duration_minutes || 0;
        const isCompleted = pc.book_classes?.status === 'completed' || 
          (pc.book_classes?.scheduled_date && 
           new Date(pc.book_classes.scheduled_date) < new Date());
        return total + (isCompleted ? duration / 60 : 0);
      }, 0) || 0;

      // Calculate hours from hosting classes
      const hoursFromHosting = hostedClasses?.reduce((total, hc) => {
        const duration = hc.duration_minutes || 0;
        const isCompleted = hc.status === 'completed' || 
          (hc.scheduled_date && new Date(hc.scheduled_date) < new Date());
        return total + (isCompleted ? duration / 60 : 0);
      }, 0) || 0;

      // Count completed classes (as participant)
      const completedCount = participantClasses?.filter(pc => {
        return pc.book_classes?.status === 'completed' || 
          (pc.book_classes?.scheduled_date && 
           new Date(pc.book_classes.scheduled_date) < new Date());
      }).length || 0;

      setStats({
        classesJoined,
        hoursLearned: Math.round((hoursFromParticipation + hoursFromHosting) * 10) / 10,
        hostedClasses: hostedCount,
        completedClasses: completedCount
      });
    } catch (error) {
      console.error('Error fetching user class stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for stats updates
    const subscription = supabase
      .channel('user-class-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_participants'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'book_classes'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { stats, loading, refreshStats: fetchStats };
};