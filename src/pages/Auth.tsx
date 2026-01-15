import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, ArrowLeft, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormValidation, validateEmail, validatePassword, sanitizeInput } from '@/components/common/FormValidation';
import { useRateLimiter } from '@/hooks/useRateLimiter';
import { handleAuthError, showErrorToast } from '@/utils/errorHandling';
import { Link } from 'react-router-dom';

// Social provider icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkRateLimit, isRateLimited, retryAfter } = useRateLimiter({ maxMessages: 5, windowMs: 60000 });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'signin' || tab === 'signup') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user) {
        // Check if profile is complete before redirecting
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (!profile?.username || !profile?.display_name) {
          // Profile incomplete - redirect to onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // Profile complete - proceed to destination
          const from = (location.state as { from?: string })?.from || '/explore';
          navigate(from, { replace: true });
        }
      }
    };
    
    checkAndRedirect();
  }, [user, navigate, location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const sanitizedEmail = sanitizeInput(email);
    const errors = [...validateEmail(sanitizedEmail)];
    if (!password) errors.push({ field: 'password', message: 'Password is required' });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!checkRateLimit()) {
      toast({ title: "Too many attempts", description: `Please wait ${retryAfter} seconds.`, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password });

      if (error) {
        showErrorToast(handleAuthError(error));
        return;
      }

      if (!rememberMe && data.session) {
        sessionStorage.setItem('ephemeral_session', 'true');
      } else {
        sessionStorage.removeItem('ephemeral_session');
      }

      // Check if user's profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', data.user.id)
        .single();
      
      if (!profile?.username || !profile?.display_name) {
        // Profile incomplete - redirect to onboarding
        toast({ title: "Welcome!", description: "Let's complete your profile setup." });
        navigate('/onboarding', { replace: true });
      } else {
        // Profile complete - proceed to destination
        toast({ title: "Welcome back!", description: "You have successfully signed in." });
        const from = (location.state as { from?: string })?.from || '/explore';
        navigate(from, { replace: true });
      }
    } catch (error) {
      showErrorToast(handleAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const sanitizedEmail = sanitizeInput(email);
    const errors = [...validateEmail(sanitizedEmail), ...validatePassword(password)];
    if (password !== confirmPassword) errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!checkRateLimit()) {
      toast({ title: "Too many attempts", description: `Please wait ${retryAfter} seconds.`, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        showErrorToast(handleAuthError(error));
        return;
      }

      toast({ title: "Check your email", description: "We've sent you a confirmation link." });
      setActiveTab('signin');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      showErrorToast(handleAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'azure' | 'apple') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) showErrorToast(handleAuthError(error));
    } catch (error) {
      showErrorToast(handleAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const SocialLoginButtons = () => (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Button type="button" variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={isLoading} className="w-full"><GoogleIcon /><span className="sr-only">Google</span></Button>
        <Button type="button" variant="outline" onClick={() => handleOAuthSignIn('azure')} disabled={isLoading} className="w-full"><MicrosoftIcon /><span className="sr-only">Microsoft</span></Button>
        <Button type="button" variant="outline" onClick={() => handleOAuthSignIn('apple')} disabled={isLoading} className="w-full"><AppleIcon /><span className="sr-only">Apple</span></Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
    </div>
  );

  return (
    <ScrollRestoreLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 self-start absolute top-4 left-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Home
        </Link>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center"><div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="h-6 w-6 text-primary" /></div></div>
            <h1 className="text-2xl font-bold tracking-tight">BookPassing</h1>
            <p className="text-muted-foreground text-sm">Join our community of book lovers</p>
          </div>
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">Welcome</CardTitle>
              <CardDescription className="text-center">Sign in or create an account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6"><TabsTrigger value="signin">Sign In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <FormValidation errors={validationErrors} />
                    <div className="space-y-2"><Label htmlFor="signin-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="off" data-testid="signin-email-input" /></div></div>
                    <div className="space-y-2"><Label htmlFor="signin-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="off" data-testid="signin-password-input" /></div></div>
                    <div className="flex items-center space-x-2"><Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} disabled={isLoading} /><Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer text-muted-foreground">Remember me</Label></div>
                    <Button type="submit" className="w-full" disabled={isLoading || isRateLimited} data-testid="signin-submit-btn">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}</Button>
                  </form>
                  <SocialLoginButtons />
                </TabsContent>
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <FormValidation errors={validationErrors} />
                    <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="off" data-testid="signup-email-input" /></div></div>
                    <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="off" data-testid="signup-password-input" /></div><p className="text-xs text-muted-foreground">At least 8 characters with a number and special character</p></div>
                    <div className="space-y-2"><Label htmlFor="signup-confirm-password">Confirm Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="off" data-testid="signup-confirm-password-input" /></div></div>
                    <Button type="submit" className="w-full" disabled={isLoading || isRateLimited} data-testid="signup-submit-btn">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}</Button>
                  </form>
                  <SocialLoginButtons />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">Having trouble? <Link to="/help" className="text-primary hover:underline">Get help</Link></p>
        </div>
      </div>
    </ScrollRestoreLayout>
  );
};

export default Auth;
