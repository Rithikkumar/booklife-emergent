import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSecurityMonitoring = () => {
  const { data: credentialAccessLogs, isLoading, error, refetch } = useQuery({
    queryKey: ['credential-access-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credential_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    credentialAccessLogs,
    isLoading,
    error,
    refetch,
  };
};