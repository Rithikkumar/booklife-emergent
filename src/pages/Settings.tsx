import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Bell, Globe, Palette, HelpCircle, Shield, Moon, Sun, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('system');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    isPrivate: false,
    showLocation: false,
    emailNotifications: true,
    pushNotifications: false,
    follows: true,
    bookClasses: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setSettings(prev => ({
          ...prev,
          isPrivate: profile.is_private || false,
          showLocation: profile.show_location || false,
          emailNotifications: profile.email_notifications ?? true,
          pushNotifications: profile.push_notifications ?? false,
          follows: profile.notify_on_follow ?? true,
          bookClasses: profile.notify_on_book_class ?? true,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('user_id', profile.user_id);

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
    } catch (error) {
      toast.error('Failed to update setting');
      console.error('Error updating setting:', error);
    }
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onChange, 
    type = 'switch' 
  }: {
    icon: any;
    title: string;
    description: string;
    value: any;
    onChange: (value: any) => void;
    type?: 'switch' | 'select';
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start space-x-3 flex-1">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {type === 'switch' ? (
        <Switch checked={value} onCheckedChange={onChange} />
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <div className="flex items-center">
                <Monitor className="h-4 w-4 mr-2" />
                System
              </div>
            </SelectItem>
            <SelectItem value="light">
              <div className="flex items-center">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );

  if (loading) {
    return (
      <ScrollRestoreLayout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </ScrollRestoreLayout>
    );
  }

  return (
    <ScrollRestoreLayout>
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account</span>
              </CardTitle>
              <CardDescription>
                Manage your profile and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div 
                  className="flex items-center justify-between py-4 cursor-pointer hover:bg-accent/50 rounded-md transition-colors px-0"
                  onClick={() => navigate('/edit-profile')}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">Edit Profile</h3>
                      <p className="text-xs text-muted-foreground mt-1">Update your profile information</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <SettingItem
                  icon={Lock}
                  title="Private Account"
                  description="Only followers can see your books"
                  value={settings.isPrivate}
                  onChange={(value) => updateProfileSetting('is_private', value)}
                />
                <Separator />
                <SettingItem
                  icon={Globe}
                  title="Show Location"
                  description="Display your location on your profile"
                  value={settings.showLocation}
                  onChange={(value) => updateProfileSetting('show_location', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingItem
                icon={Palette}
                title="Theme"
                description="Choose your preferred theme"
                value={theme}
                onChange={setTheme}
                type="select"
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Control what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <SettingItem
                  icon={Bell}
                  title="Email Notifications"
                  description="Receive notifications via email"
                  value={settings.emailNotifications}
                  onChange={(value) => updateProfileSetting('email_notifications', value)}
                />
                <Separator />
                <SettingItem
                  icon={Bell}
                  title="Push Notifications"
                  description="Receive push notifications on your device"
                  value={settings.pushNotifications}
                  onChange={(value) => updateProfileSetting('push_notifications', value)}
                />
                <Separator />
                <SettingItem
                  icon={Bell}
                  title="New Followers"
                  description="Get notified when someone follows you"
                  value={settings.follows}
                  onChange={(value) => updateProfileSetting('notify_on_follow', value)}
                />
                <Separator />
                <SettingItem
                  icon={Bell}
                  title="Book Classes"
                  description="Get notified about book class updates"
                  value={settings.bookClasses}
                  onChange={(value) => updateProfileSetting('notify_on_book_class', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security & Privacy</span>
              </CardTitle>
              <CardDescription>
                Keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="flex items-center justify-between py-4 cursor-pointer hover:bg-accent/50 rounded-md transition-colors px-0"
                onClick={() => setChangePasswordOpen(true)}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                    <p className="text-xs text-muted-foreground mt-1">Update your account password</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Support</span>
              </CardTitle>
              <CardDescription>
                Get help and provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Help Center</p>
                      <p className="text-xs text-muted-foreground">Get help with using the app</p>
                    </div>
                  </div>
                </Button>
                <Separator />
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Contact Support</p>
                      <p className="text-xs text-muted-foreground">Get in touch with our support team</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ChangePasswordDialog 
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </ScrollRestoreLayout>
  );
};

export default Settings;