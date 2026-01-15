import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  profileComplete: boolean;
  checkProfileComplete: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  profileComplete: false,
  checkProfileComplete: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const checkProfileComplete = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Profile is complete only if it exists AND has non-empty username AND display_name
      const isComplete = !error && !!(profile?.username?.trim() && profile?.display_name?.trim());
      setProfileComplete(isComplete);
      return isComplete;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Check profile completion when user logs in
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('username, display_name')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            // Profile is complete only if it exists AND has non-empty username AND display_name
            setProfileComplete(!error && !!(profile?.username?.trim() && profile?.display_name?.trim()));
          }, 0);
        } else {
          setProfileComplete(false);
        }
      }
    );

    // THEN check for existing session (synchronous from localStorage cache)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        // Profile is complete only if it exists AND has non-empty username AND display_name
        setProfileComplete(!error && !!(profile?.username?.trim() && profile?.display_name?.trim()));
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    userId: user?.id ?? null,
    profileComplete,
    checkProfileComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
