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
    if (user) {
      navigate('/explore', { replace: true });
    }
  }, [user, navigate]);

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

      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      const from = (location.state as { from?: string })?.from || '/explore';
      navigate(from, { replace: true });
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
                    <div className="space-y-2"><Label htmlFor="signin-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="email" /></div></div>
                    <div className="space-y-2"><Label htmlFor="signin-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="current-password" /></div></div>
                    <div className="flex items-center space-x-2"><Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} disabled={isLoading} /><Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer text-muted-foreground">Remember me</Label></div>
                    <Button type="submit" className="w-full" disabled={isLoading || isRateLimited}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}</Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
                </TabsContent>
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <FormValidation errors={validationErrors} />
                    <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="email" /></div></div>
                    <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="new-password" /></div><p className="text-xs text-muted-foreground">At least 8 characters with a number and special character</p></div>
                    <div className="space-y-2"><Label htmlFor="signup-confirm-password">Confirm Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="signup-confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" disabled={isLoading} autoComplete="new-password" /></div></div>
                    <Button type="submit" className="w-full" disabled={isLoading || isRateLimited}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}</Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
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
