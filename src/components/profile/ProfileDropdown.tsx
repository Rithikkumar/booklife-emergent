import React, { useState, useEffect } from 'react';
import { User, Settings, MapPin, Bookmark, HelpCircle, LogOut, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  username: string;
  display_name: string;
  profile_picture_url?: string;
}

const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, profile_picture_url')
            .eq('user_id', user.id)
            .single();
          
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Fetch profile for new user
        supabase
          .from('profiles')
          .select('username, display_name, profile_picture_url')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-8 w-8 bg-muted rounded-full"></div>
      </div>
    );
  }

  // If user is not authenticated, show sign in options
  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => navigate('/auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </button>
        <button 
          onClick={() => navigate('/auth')}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          Join
        </button>
      </div>
    );
  }

  // If user exists but no profile yet, show fallback with user metadata
  if (!profile) {
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    const username = user.user_metadata?.username || 'user';
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-muted transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg">
          {/* User Info Header */}
          <div className="px-2 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent-200 flex items-center justify-center text-accent-700 font-medium overflow-hidden">
                {displayName[0]}
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
            onClick={() => navigate('/edit-profile')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Setup Profile</span>
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
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-muted transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.profile_picture_url} alt={profile.display_name} />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg">
        {/* User Info Header */}
        <div className="px-2 py-3 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-accent-200 flex items-center justify-center text-accent-700 font-medium overflow-hidden">
              {profile.profile_picture_url ? (
                <img 
                  src={profile.profile_picture_url} 
                  alt={profile.display_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.display_name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.display_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{profile.username}
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
  );
};

export default ProfileDropdown;