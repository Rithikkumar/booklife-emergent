import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface LiveClass {
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
  show_participant_count: boolean;
}

export interface UserInterest {
  interest_type: string;
  interest_value: string;
  weight: number;
}

export const useLiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserInterests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: interestError } = await supabase.rpc('get_user_interests', {
        p_user_id: user.id
      });

      if (interestError) throw interestError;
      setUserInterests(data || []);
    } catch (err) {
      console.error('Error fetching user interests:', err);
      // Don't show error toast for interests as it's not critical
    }
  };

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const { data, error: classError } = await supabase.rpc('get_live_book_classes', {
        search_query: null,
        filter_categories: null,
        include_upcoming: true
      });

      if (classError) throw classError;
      
      // Filter and sort classes based on user interests
      const filteredClasses = filterClassesByInterest(data || []);
      setLiveClasses(filteredClasses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live classes';
      setError(errorMessage);
      console.error('Error fetching live classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterClassesByInterest = (classes: LiveClass[]): LiveClass[] => {
    if (userInterests.length === 0) {
      // If no user interests, return all classes sorted by status and time
      return classes.sort((a, b) => {
        // Prioritize ongoing classes
        if (a.is_ongoing && !b.is_ongoing) return -1;
        if (!a.is_ongoing && b.is_ongoing) return 1;
        
        // Then sort by scheduled time
        return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
      });
    }

    // Create interest maps for fast lookup
    const tagInterests = new Map(
      userInterests
        .filter(i => i.interest_type === 'tag')
        .map(i => [i.interest_value.toLowerCase(), i.weight])
    );
    const categoryInterests = new Map(
      userInterests
        .filter(i => i.interest_type === 'category')
        .map(i => [i.interest_value.toLowerCase(), i.weight])
    );

    // Calculate interest scores for each class
    const classesWithScores = classes.map(cls => {
      let score = 0;

      // Score based on category
      if (cls.category && categoryInterests.has(cls.category.toLowerCase())) {
        score += categoryInterests.get(cls.category.toLowerCase()) || 0;
      }

      // Score based on tags
      if (cls.tags && cls.tags.length > 0) {
        cls.tags.forEach(tag => {
          if (tagInterests.has(tag.toLowerCase())) {
            score += (tagInterests.get(tag.toLowerCase()) || 0) * 0.5; // Tags worth less than category
          }
        });
      }

      // Score based on book title/author keywords (basic keyword matching)
      if (cls.book_title || cls.book_author) {
        const bookText = `${cls.book_title || ''} ${cls.book_author || ''}`.toLowerCase();
        userInterests.forEach(interest => {
          if (bookText.includes(interest.interest_value.toLowerCase())) {
            score += interest.weight * 0.3; // Book content matching gets moderate weight
          }
        });
      }

      return { ...cls, interestScore: score };
    });

    // Sort by interest score (descending), then by live status, then by time
    return classesWithScores.sort((a, b) => {
      // First by interest score
      if (a.interestScore !== b.interestScore) {
        return b.interestScore - a.interestScore;
      }
      
      // Then prioritize ongoing classes
      if (a.is_ongoing && !b.is_ongoing) return -1;
      if (!a.is_ongoing && b.is_ongoing) return 1;
      
      // Finally sort by scheduled time
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    });
  };

  const joinClass = async (classId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to join a class",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('class_participants')
        .insert({
          class_id: classId,
          user_id: user.id
        });

      if (error) {
        // Check if user is already registered
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already registered",
            description: "You are already registered for this class",
            variant: "default"
          });
          return true;
        }
        throw error;
      }

      toast({
        title: "Successfully joined!",
        description: "You have been registered for this class",
      });
      
      // Refresh the classes to update participant count
      await fetchLiveClasses();
      
      // Dispatch event so other components can refresh
      window.dispatchEvent(new CustomEvent('classJoined'));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join class';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchUserInterests();
      await fetchLiveClasses();
    };
    
    initialize();

    // Listen for custom class creation events
    const handleClassCreated = () => {
      fetchLiveClasses();
    };
    
    window.addEventListener('classCreated', handleClassCreated);

    // Set up real-time subscription for live classes updates
    const subscription = supabase
      .channel('live-classes-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'book_classes'
      }, () => {
        fetchLiveClasses();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_participants'
      }, () => {
        fetchLiveClasses();
      })
      .subscribe();

    return () => {
      window.removeEventListener('classCreated', handleClassCreated);
      subscription.unsubscribe();
    };
  }, []);

  return {
    liveClasses,
    userInterests,
    loading,
    error,
    joinClass,
    refreshClasses: fetchLiveClasses
  };
};