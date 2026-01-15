import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  User, 
  AtSign, 
  Camera,
  Globe,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import imageCompression from 'browser-image-compression';

interface OnboardingData {
  username: string;
  displayName: string;
  bio: string;
  profileVisibility: 'public' | 'private';
  profilePicture: string | null;
}

const TOTAL_STEPS = 4;

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    username: '',
    displayName: '',
    bio: '',
    profileVisibility: 'public',
    profilePicture: null
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user already has a complete profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.username && profile?.display_name) {
        // Profile already complete, redirect
        navigate('/explore', { replace: true });
      }
    };
    
    checkExistingProfile();
  }, [user, navigate]);

  // Debounced username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (!data.username || data.username.length < 3) {
        setUsernameAvailable(null);
        setUsernameError(null);
        return;
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(data.username)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        setUsernameAvailable(false);
        return;
      }

      if (data.username.length > 30) {
        setUsernameError('Username must be 30 characters or less');
        setUsernameAvailable(false);
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError(null);

      try {
        const { data: existing, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', data.username.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        
        if (existing) {
          setUsernameAvailable(false);
          setUsernameError('This username is already taken');
        } else {
          setUsernameAvailable(true);
          setUsernameError(null);
        }
      } catch (error) {
        logger.error('[Onboarding] Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [data.username]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true
      });

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      logger.error('[Onboarding] Error processing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process image',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (base64Image: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert base64 to blob
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        logger.error('[Onboarding] Upload error:', uploadError);
        return null;
      }

      const { data: publicUrl } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (error) {
      logger.error('[Onboarding] Error uploading profile picture:', error);
      return null;
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let profilePictureUrl = null;

      // Upload profile picture if selected
      if (data.profilePicture) {
        profilePictureUrl = await uploadProfilePicture(data.profilePicture);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username.toLowerCase(),
          display_name: data.displayName,
          bio: data.bio || null,
          profile_visibility: data.profileVisibility,
          is_private: data.profileVisibility === 'private',
          profile_picture_url: profilePictureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Welcome to BookPassing!',
        description: 'Your profile has been set up successfully.'
      });

      navigate('/explore', { replace: true });
    } catch (error) {
      logger.error('[Onboarding] Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.username.length >= 3 && usernameAvailable === true;
      case 2:
        return data.displayName.length >= 2;
      case 3:
        return true; // Privacy selection always valid
      case 4:
        return true; // Bio is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <AtSign className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Create your username</h2>
              <p className="text-muted-foreground">
                Choose a unique username. This is how others will find you.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  data-testid="onboarding-username-input"
                  value={data.username}
                  onChange={(e) => setData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="your_username"
                  className={`pl-8 pr-10 lowercase ${
                    usernameAvailable === true ? 'border-green-500 focus-visible:ring-green-500' : 
                    usernameAvailable === false ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  maxLength={30}
                  autoFocus
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" data-testid="username-checking-spinner" />}
                  {!isCheckingUsername && usernameAvailable === true && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500" data-testid="username-available-check">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-destructive" data-testid="username-unavailable-x">
                      <span className="text-white text-xs font-bold">✕</span>
                    </div>
                  )}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive flex items-center gap-1" data-testid="username-error">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive"></span>
                  {usernameError}
                </p>
              )}
              {usernameAvailable && !usernameError && (
                <p className="text-sm text-green-600 flex items-center gap-1" data-testid="username-available-message">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Username is available!
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                3-30 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">What's your name?</h2>
              <p className="text-muted-foreground">
                Add your name so friends can find you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  data-testid="onboarding-displayname-input"
                  value={data.displayName}
                  onChange={(e) => setData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your Name"
                  maxLength={50}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This is how your name will appear on your profile.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="onboarding-avatar-upload"
                >
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={data.profilePicture || undefined} />
                    <AvatarFallback className="text-2xl bg-muted">
                      {data.displayName ? data.displayName.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-md">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="onboarding-file-input"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Tap to add a profile photo (optional)
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {data.profileVisibility === 'public' ? (
                  <Globe className="h-8 w-8 text-primary" />
                ) : (
                  <Lock className="h-8 w-8 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold">Account privacy</h2>
              <p className="text-muted-foreground">
                Choose who can see your profile and books.
              </p>
            </div>

            <RadioGroup
              value={data.profileVisibility}
              onValueChange={(value) => setData(prev => ({ ...prev, profileVisibility: value as 'public' | 'private' }))}
              className="space-y-3"
            >
              <Label
                htmlFor="public"
                className={`flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  data.profileVisibility === 'public' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="font-medium">Public</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Anyone can see your profile, books, and journey. Your books will appear in search results.
                  </p>
                </div>
              </Label>

              <Label
                htmlFor="private"
                className={`flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  data.profileVisibility === 'private' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Private</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only people you approve can see your books and journey. You can change this later.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Almost there!</h2>
              <p className="text-muted-foreground">
                Add a bio to let others know about you (optional).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={data.bio}
                onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Book lover 📚 | Fantasy & Sci-Fi enthusiast | Always passing it forward..."
                rows={4}
                maxLength={200}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {data.bio.length}/200 characters
              </p>
            </div>

            {/* Profile Preview */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={data.profilePicture || undefined} />
                  <AvatarFallback className="text-lg">
                    {data.displayName ? data.displayName.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{data.displayName || 'Your Name'}</p>
                  <p className="text-sm text-muted-foreground">@{data.username || 'username'}</p>
                </div>
                <div className="ml-auto">
                  {data.profileVisibility === 'private' ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {data.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{data.bio}</p>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BookPassing</span>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-1" />
          <CardDescription className="text-center pt-2">
            Step {currentStep} of {TOTAL_STEPS}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-4 border-t" data-testid="onboarding-navigation">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1 || isLoading}
              className="gap-2"
              data-testid="onboarding-back-btn"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isLoading}
                className="gap-2"
                data-testid="onboarding-next-btn"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="gap-2"
                data-testid="onboarding-complete-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
