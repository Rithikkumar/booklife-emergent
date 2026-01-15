import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is an email confirmation (has token_hash and type in URL)
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (tokenHash && type === 'email') {
          setStatus('Verifying email...');
          // This is an email confirmation - verify the OTP
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email',
          });
          
          if (verifyError) {
            logger.error('[AuthCallback] Email verification error:', verifyError);
            setError('Email verification failed. Please try again.');
            setTimeout(() => navigate('/auth'), 3000);
            return;
          }
        }

        // Wait a moment for the session to be established
        setStatus('Completing sign in...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('[AuthCallback] Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (session) {
          setStatus('Checking profile...');
          // Check if profile is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', session.user.id)
            .single();
          
          if (!profile?.username || !profile?.display_name) {
            // Profile incomplete - redirect to onboarding
            logger.debug('[AuthCallback] Profile incomplete, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
          } else {
            // Profile complete - redirect to explore
            logger.debug('[AuthCallback] Profile complete, redirecting to explore');
            navigate('/explore', { replace: true });
          }
        } else {
          // No session found - might be an error or user cancelled
          logger.warn('[AuthCallback] No session found after callback');
          setError('Authentication was cancelled or failed. Redirecting...');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        logger.error('[AuthCallback] Unexpected error during callback:', err);
        setError('An unexpected error occurred. Redirecting...');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

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
            <p className="text-muted-foreground">{status}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
