import React from 'react';
import { User, Settings, MapPin, HelpCircle, LogOut, UserIcon, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { clearSensitiveData } from '@/utils/apiValidation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Use React Query for caching - prevents refetch on every navigation
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  const handleSignOut = async () => {
    try {
      clearSensitiveData();
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  // Fixed-size container that never changes dimensions
  // This prevents any layout shift regardless of auth state
  const containerClasses = "flex items-center justify-center flex-shrink-0";
  const containerStyle = { width: '36px', height: '36px' };

  // Loading state - show skeleton with exact same dimensions as avatar
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
      </div>
    );
  }

  // Unauthenticated state - show avatar with login icon that opens dropdown
  if (!isAuthenticated) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-muted">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg">
            <div className="p-3 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={() => navigate('/auth')}
              >
                Join BookPassing
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Authenticated state - show dropdown
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.user_metadata?.username || 'user';
  const profilePictureUrl = profile?.profile_picture_url;

  return (
    <div className={containerClasses} style={containerStyle}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {profilePictureUrl && (
                <AvatarImage src={profilePictureUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary/10">
                <UserIcon className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg">
          {/* User Info Header */}
          <div className="px-2 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent-200 flex items-center justify-center text-accent-700 font-medium overflow-hidden flex-shrink-0">
                {profilePictureUrl ? (
                  <img 
                    src={profilePictureUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{username}
                </p>
              </div>
            </div>
          </div>

          <DropdownMenuItem 
            onClick={() => navigate('/profile')}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/print-stickers')}
            className="cursor-pointer"
          >
            <Printer className="mr-2 h-4 w-4" />
            <span>Print Stickers</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/following-journeys')}
            className="cursor-pointer"
          >
            <MapPin className="mr-2 h-4 w-4" />
            <span>Following Journeys</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => navigate('/settings')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/help')}
            className="cursor-pointer"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help Center</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileDropdown;
