import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormValidation, validateEmail, validatePassword, sanitizeInput } from '@/components/common/FormValidation';
import { handleAuthError, showErrorToast, rateLimiter, logSecurityEvent } from '@/utils/errorHandling';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Array<{field: string, message: string}>>([]);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Sanitize inputs
    const sanitizedEmailOrUsername = sanitizeInput(emailOrUsername);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmailOrUsername || !sanitizedPassword) {
      setValidationErrors([{ field: 'general', message: 'Please fill in all fields' }]);
      return;
    }

    // Rate limiting
    const rateLimitKey = `signin:${sanitizedEmailOrUsername}`;
    if (rateLimiter.isRateLimited(rateLimitKey)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { type: 'signin', identifier: sanitizedEmailOrUsername });
      setValidationErrors([{ field: 'general', message: 'Too many sign-in attempts. Please wait a few minutes before trying again.' }]);
      return;
    }

    setIsLoading(true);
    try {
      // For testing: if credentials are test/test, ensure user exists via Edge Function and sign in
      if (sanitizedEmailOrUsername === 'test' && sanitizedPassword === 'test') {
        try {
          await supabase.functions.invoke('create-test-user');
        } catch (_) {
          // ignore - user may already exist
        }

        // Try with password 'test' first
        let { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'test',
        });

        // If that fails, try legacy 'test123' then reset to 'test'
        if (signInError) {
          const { error: fallbackError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'test123',
          });
          if (fallbackError) {
            const errorInfo = handleAuthError(fallbackError);
            setValidationErrors([{ field: 'general', message: errorInfo.message }]);
            return;
          }
          // Reset password to 'test' for future
          await supabase.auth.updateUser({ password: 'test' });
        }

        toast.success('Signed in successfully!');
        rateLimiter.reset(rateLimitKey);
        
        // Navigate to intended page or home
        const from = location.state?.from || '/';
        navigate(from);
        return;
      }

      // For regular users: validate email format
      if (!sanitizedEmailOrUsername.includes('@')) {
        setValidationErrors([{ field: 'email', message: 'Please use your email address to sign in' }]);
        return;
      }

      // Validate email format
      const emailValidation = validateEmail(sanitizedEmailOrUsername);
      if (emailValidation.length > 0) {
        setValidationErrors(emailValidation);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmailOrUsername,
        password: sanitizedPassword,
      });

      if (error) {
        const errorInfo = handleAuthError(error);
        setValidationErrors([{ field: 'general', message: errorInfo.message }]);
        
        // Log security events for suspicious activity
        if (error.message.includes('Invalid login credentials')) {
          logSecurityEvent('FAILED_LOGIN_ATTEMPT', { email: sanitizedEmailOrUsername });
        }
        return;
      }

      toast.success('Signed in successfully!');
      rateLimiter.reset(rateLimitKey);
      
      // Navigate to intended page or home
      const from = location.state?.from || '/';
      navigate(from);
    } catch (error) {
      const errorInfo = handleAuthError(error);
      showErrorToast(errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    // Validate all fields
    const errors = [
      ...validateEmail(sanitizedEmail),
      ...validatePassword(sanitizedPassword)
    ];
    
    if (!sanitizedConfirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (sanitizedPassword !== sanitizedConfirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Rate limiting
    const rateLimitKey = `signup:${sanitizedEmail}`;
    if (rateLimiter.isRateLimited(rateLimitKey)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { type: 'signup', email: sanitizedEmail });
      setValidationErrors([{ field: 'general', message: 'Too many signup attempts. Please wait a few minutes before trying again.' }]);
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        const errorInfo = handleAuthError(error);
        setValidationErrors([{ field: 'general', message: errorInfo.message }]);
        
        // Log security events
        if (error.message.includes('User already registered')) {
          logSecurityEvent('DUPLICATE_SIGNUP_ATTEMPT', { email: sanitizedEmail });
        }
        return;
      }

      toast.success('Account created! Please check your email to verify your account.');
      rateLimiter.reset(rateLimitKey);
    } catch (error) {
      const errorInfo = handleAuthError(error);
      showErrorToast(errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollRestoreLayout>
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Book Life</CardTitle>
            <p className="text-muted-foreground">Join our community of book lovers</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <FormValidation errors={validationErrors} />
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="email@example.com"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <FormValidation errors={validationErrors} />
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={128}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={128}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ScrollRestoreLayout>
  );
};

export default Auth;