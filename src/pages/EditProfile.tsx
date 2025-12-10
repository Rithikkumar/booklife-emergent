import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, X } from 'lucide-react';
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

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast.error('Error loading profile');
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
      setOriginalUsername(profileData.username);
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username === originalUsername) return true;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    return !data;
  };

  const handleSave = async () => {
    if (!validateUsername(profile.username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    const isUsernameAvailable = await checkUsernameAvailability(profile.username);
    if (!isUsernameAvailable) {
      toast.error('Username is already taken');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          location: profile.location,
          profile_picture_url: profile.profile_picture_url,
          cover_photo_url: profile.cover_photo_url,
          is_private: profile.is_private,
          show_location: profile.show_location,
          location_sharing_level: profile.location_sharing_level,
          profile_visibility: profile.profile_visibility,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate(`/profile/${profile.username}`);
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

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
                  {profile.display_name?.charAt(0) || profile.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <ImageUpload
                  label="Profile Picture"
                  value={profile.profile_picture_url}
                  onChange={(file, url) => {
                    setProfileImageFile(file);
                    handleInputChange('profile_picture_url', url);
                  }}
                  variant="profile"
                  maxSize={2}
                  preview={false}
                />
              </div>
            </div>

            {/* Cover Photo */}
            <ImageUpload
              label="Cover Photo"
              value={profile.cover_photo_url}
              onChange={(file, url) => {
                setCoverImageFile(file);
                handleInputChange('cover_photo_url', url);
              }}
              variant="cover"
              maxSize={5}
            />

            {/* Username */}
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="your_username"
              />
              <p className="text-sm text-muted-foreground mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={profile.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your Display Name"
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
              />
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
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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