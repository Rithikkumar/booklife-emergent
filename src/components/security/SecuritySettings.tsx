import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, MapPin, Users, Lock, Info } from 'lucide-react';
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export const SecuritySettings = () => {
  const { data: profile, refetch } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePrivacySettings = async (field: string, value: any) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('user_id', profile?.user_id);

      if (error) throw error;
      
      toast.success('Privacy settings updated');
      refetch();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const getLocationSharingDescription = (level: string) => {
    switch (level) {
      case 'none': return 'Your location is completely hidden';
      case 'city': return 'Only your city is visible to others';
      case 'neighborhood': return 'Your neighborhood and city are visible';
      case 'exact': return 'Your exact location is visible (use with caution)';
      default: return 'City-level location sharing';
    }
  };

  const getPrivacyBadgeVariant = (isPrivate: boolean) => {
    return isPrivate ? 'destructive' : 'secondary';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Security & Privacy Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your privacy preferences and security settings
        </p>
      </div>

      {/* Profile Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and book collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Private Profile</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile and books visible only to followers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getPrivacyBadgeVariant(profile?.is_private)}>
                {profile?.is_private ? 'Private' : 'Public'}
              </Badge>
              <Switch
                checked={profile?.is_private || false}
                onCheckedChange={(checked) => updatePrivacySettings('is_private', checked)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Sharing
          </CardTitle>
          <CardDescription>
            Choose how much location information to share with your books
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Location Sharing Level</Label>
            <Select
              value={profile?.location_sharing_level || 'city'}
              onValueChange={(value) => updatePrivacySettings('location_sharing_level', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Hide Location
                  </div>
                </SelectItem>
                <SelectItem value="city">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    City Only
                  </div>
                </SelectItem>
                <SelectItem value="neighborhood">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Neighborhood
                  </div>
                </SelectItem>
                <SelectItem value="exact">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Exact Location
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              {getLocationSharingDescription(profile?.location_sharing_level || 'city')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information
          </CardTitle>
          <CardDescription>
            Your account security status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Authentication</span>
              </div>
              <Badge variant="secondary">Protected</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Your account uses secure authentication
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="font-medium">Data Encryption</span>
              </div>
              <Badge variant="secondary">Encrypted</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Your data is encrypted in transit and at rest
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Security Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use a strong, unique password for your account</li>
              <li>• Be careful about exact location sharing</li>
              <li>• Regularly review your privacy settings</li>
              <li>• Report any suspicious activity to administrators</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};