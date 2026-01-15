import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
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

interface OnboardingData {
  username: string;
  displayName: string;
  bio: string;
  profileVisibility: 'public' | 'private';
  profilePicture: string | null;
}

const TOTAL_STEPS = 4;

// Test version of Onboarding without auth requirement
const OnboardingTest: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Simulated username validation
  const handleUsernameChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setData(prev => ({ ...prev, username: cleanValue }));
    
    if (cleanValue.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
    } else if (cleanValue.length > 30) {
      setUsernameError('Username must be 30 characters or less');
      setUsernameAvailable(false);
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanValue)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(false);
    } else {
      // Simulate availability check
      setUsernameAvailable(true);
      setUsernameError(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setData(prev => ({ ...prev, profilePicture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.username.length >= 3 && usernameAvailable === true;
      case 2:
        return data.displayName.length >= 2;
      case 3:
        return true;
      case 4:
        return true;
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

  const handleComplete = () => {
    alert('Onboarding complete! (Test mode)');
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
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your_username"
                  className="pl-8 pr-10"
                  maxLength={30}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameAvailable === true && <Check className="h-4 w-4 text-green-500" data-testid="username-available-check" />}
                  {usernameAvailable === false && <span className="text-destructive text-xs" data-testid="username-unavailable-x">✕</span>}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive" data-testid="username-error">{usernameError}</p>
              )}
              {usernameAvailable && !usernameError && (
                <p className="text-sm text-green-600" data-testid="username-available-message">Username is available!</p>
              )}
              <p className="text-xs text-muted-foreground">
                3-30 characters. Letters, numbers, and underscores only.
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
                <RadioGroupItem value="public" id="public" className="mt-1" data-testid="onboarding-public-radio" />
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
                <RadioGroupItem value="private" id="private" className="mt-1" data-testid="onboarding-private-radio" />
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
                data-testid="onboarding-bio-input"
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
            <div className="bg-muted/50 rounded-xl p-4 space-y-3" data-testid="onboarding-profile-preview">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BookPassing</span>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-1" data-testid="onboarding-progress" />
          <CardDescription className="text-center pt-2" data-testid="onboarding-step-indicator">
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
              disabled={currentStep === 1}
              className="gap-2"
              data-testid="onboarding-back-btn"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2"
                data-testid="onboarding-next-btn"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="gap-2"
                data-testid="onboarding-complete-btn"
              >
                Complete
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingTest;
