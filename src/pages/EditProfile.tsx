import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, Check, AlertCircle } from 'lucide-react';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LocationSearchInput from '@/components/common/LocationSearchInput';
import ImageUpload from '@/components/common/ImageUpload';

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  profile_picture_url: string;
  cover_photo_url: string;
  is_private: boolean;
  show_location: boolean;
  location_sharing_level: 'none' | 'city' | 'neighborhood' | 'exact';
  profile_visibility: 'public' | 'private' | 'followers';
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'too_short';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    profile_picture_url: '',
    cover_photo_url: '',
    is_private: false,
    show_location: false,
    location_sharing_level: 'city',
    profile_visibility: 'public',
  });
  const [originalUsername, setOriginalUsername] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast.error('Error loading profile');
        setInitialLoading(false);
        return;
      }

      setProfile({
        username: profileData.username || '',
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        profile_picture_url: profileData.profile_picture_url || '',
        cover_photo_url: profileData.cover_photo_url || '',
        is_private: profileData.is_private || false,
        show_location: profileData.show_location || false,
        location_sharing_level: (profileData.location_sharing_level as 'none' | 'city' | 'neighborhood' | 'exact') || 'city',
        profile_visibility: (profileData.profile_visibility as 'public' | 'private' | 'followers') || 'public',
      });
      setOriginalUsername(profileData.username || '');
      setInitialLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const validateUsername = (username: string): { valid: boolean; message: string; status: UsernameStatus } => {
    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters', status: 'too_short' };
    }
    if (username.length > 20) {
      return { valid: false, message: 'Username must be 20 characters or less', status: 'invalid' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Only letters, numbers, and underscores allowed', status: 'invalid' };
    }
    return { valid: true, message: '', status: 'idle' };
  };

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username === originalUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    const validation = validateUsername(username);
    if (!validation.valid) {
      setUsernameStatus(validation.status);
      setUsernameMessage(validation.message);
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability...');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .neq('user_id', userId || '')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUsernameStatus('taken');
        setUsernameMessage('This username is already taken');
      } else {
        setUsernameStatus('available');
        setUsernameMessage('Username is available');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('idle');
      setUsernameMessage('');
    }
  }, [originalUsername, userId]);

  // Debounced username check
  useEffect(() => {
    if (!profile.username || profile.username === originalUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(profile.username);
    }, 500);

    return () => clearTimeout(timer);
  }, [profile.username, checkUsernameAvailability, originalUsername]);

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'too_short') {
      toast.error(usernameMessage || 'Please fix username issues before saving');
      return;
    }

    if (usernameStatus === 'checking') {
      toast.error('Please wait for username check to complete');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username.toLowerCase(),
          display_name: profile.display_name,
          bio: profile.bio,
          location: profile.location,
          profile_picture_url: profile.profile_picture_url,
          cover_photo_url: profile.cover_photo_url,
          is_private: profile.is_private,
          show_location: profile.show_location,
          location_sharing_level: profile.location_sharing_level,
          profile_visibility: profile.profile_visibility,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate(`/profile/${profile.username}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'taken':
        return <X className="w-4 h-4 text-destructive" />;
      case 'invalid':
      case 'too_short':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getUsernameInputClass = () => {
    switch (usernameStatus) {
      case 'available':
        return 'border-green-500 focus-visible:ring-green-500';
      case 'taken':
      case 'invalid':
      case 'too_short':
        return 'border-destructive focus-visible:ring-destructive';
      default:
        return '';
    }
  };

  const getUsernameMessageColor = () => {
    switch (usernameStatus) {
      case 'available':
        return 'text-green-500';
      case 'taken':
      case 'invalid':
      case 'too_short':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (initialLoading) {
    return (
      <ScrollRestoreLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ScrollRestoreLayout>
    );
  }

  return (
    <ScrollRestoreLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <Button
            variant="outline"
            onClick={() => navigate(`/profile/${originalUsername}`)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profile_picture_url} alt="Profile" />
                <AvatarFallback>
                  {profile.display_name?.charAt(0) || profile.username.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <ImageUpload
                  label="Profile Picture"
                  value={profile.profile_picture_url}
                  onChange={(file, url) => {
                    handleInputChange('profile_picture_url', url);
                  }}
                  variant="profile"
                  maxSize={2}
                  preview={false}
                  userId={userId || undefined}
                  imageType="avatar"
                  uploadToStorage={true}
                />
              </div>
            </div>

            {/* Cover Photo */}
            <ImageUpload
              label="Cover Photo"
              value={profile.cover_photo_url}
              onChange={(file, url) => {
                handleInputChange('cover_photo_url', url);
              }}
              variant="cover"
              maxSize={5}
              userId={userId || undefined}
              imageType="cover"
              uploadToStorage={true}
            />

            {/* Username with Instagram-style feedback */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_username"
                  className={`pr-10 ${getUsernameInputClass()}`}
                  maxLength={20}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getUsernameStatusIcon()}
                </div>
              </div>
              {usernameMessage && (
                <p className={`text-sm ${getUsernameMessageColor()}`}>
                  {usernameMessage}
                </p>
              )}
              {!usernameMessage && (
                <p className="text-sm text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={profile.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your Display Name"
                maxLength={50}
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {profile.bio.length}/160
              </p>
            </div>

            {/* Location */}
            <LocationSearchInput
              label="Location"
              placeholder="Search for your location..."
              value={profile.location}
              onChange={(location, inputValue) => handleInputChange('location', inputValue)}
            />

            {/* Privacy Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Privacy Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="private-profile">Private Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Only followers can see your books
                  </p>
                </div>
                <Switch
                  id="private-profile"
                  checked={profile.is_private}
                  onCheckedChange={(checked) => handleInputChange('is_private', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-location">Show Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your location on your profile
                  </p>
                </div>
                <Switch
                  id="show-location"
                  checked={profile.show_location}
                  onCheckedChange={(checked) => handleInputChange('show_location', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-sharing">Location Sharing Level</Label>
                <Select
                  value={profile.location_sharing_level}
                  onValueChange={(value: 'none' | 'city' | 'neighborhood' | 'exact') => 
                    handleInputChange('location_sharing_level', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sharing level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Hide location completely</SelectItem>
                    <SelectItem value="city">City only</SelectItem>
                    <SelectItem value="neighborhood">Neighborhood and city</SelectItem>
                    <SelectItem value="exact">Exact location (precise coordinates)</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground">
                   Choose how detailed your location information appears to others when viewing your books
                 </p>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="profile-visibility">Profile Visibility</Label>
                 <Select
                   value={profile.profile_visibility}
                   onValueChange={(value: 'public' | 'private' | 'followers') => 
                     handleInputChange('profile_visibility', value)
                   }
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select profile visibility" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                     <SelectItem value="followers">Followers only - Only your followers can view</SelectItem>
                     <SelectItem value="private">Private - Only you can view</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-sm text-muted-foreground">
                   Control who can see your profile and books
                 </p>
               </div>
             </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollRestoreLayout>
  );
};

export default EditProfile;
