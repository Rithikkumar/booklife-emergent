import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash (Supabase OAuth returns tokens in URL)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('OAuth callback error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (session) {
          // Successfully authenticated - redirect to explore
          navigate('/explore', { replace: true });
        } else {
          // No session found - might be an error or user cancelled
          setError('Authentication was cancelled or failed. Redirecting...');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        logger.error('Unexpected error during OAuth callback:', err);
        setError('An unexpected error occurred. Redirecting...');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-destructive text-lg">{error}</div>
            <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
