import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearSensitiveCaches } from '@/utils/securityCache';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  requireProfileComplete?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth',
  requireProfileComplete = true
}) => {
  // Use global auth state from AuthContext - no local state duplication
  const { user, isLoading, profileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for sign out events to clear caches
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          clearSensitiveCaches();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Only show loading skeleton on initial app load (not on navigation)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation skeleton */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-[60px]">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="pt-[76px] container mx-auto px-4">
          <div className="h-8 w-48 rounded bg-muted animate-pulse mb-4" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse mb-8" />
          <div className="grid gap-4">
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    navigate(redirectTo, { 
      replace: true,
      state: { from: location.pathname }
    });
    return null;
  }

  // If profile completion is required but profile is incomplete (and not on onboarding page)
  if (requireAuth && user && requireProfileComplete && !profileComplete && location.pathname !== '/onboarding') {
    navigate('/onboarding', { replace: true });
    return null;
  }

  // If authentication is not required but user is authenticated and on auth page
  if (!requireAuth && user && location.pathname === '/auth') {
    // Check profile completion before redirecting
    if (!profileComplete) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/explore', { replace: true });
    }
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;