import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  currentUserId?: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  is_private: boolean;
}

interface UserWithFollowStatus extends UserProfile {
  isFollowing: boolean;
}

const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  currentUserId,
}) => {
  const [users, setUsers] = useState<UserWithFollowStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const username = user.username.toLowerCase();
    const displayName = (user.display_name || '').toLowerCase();
    
    return username.includes(query) || displayName.includes(query);
  });

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(''); // Reset search when opening
      fetchUsers();
    }
  }, [isOpen, userId, type, currentUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch followers or following
      const { data: followData, error: followError } = await supabase
        .from('followers')
        .select(`
          id,
          created_at,
          follower_id,
          following_id
        `)
        .eq(type === 'followers' ? 'following_id' : 'follower_id', userId);

      if (followError) throw followError;

      if (!followData || followData.length === 0) {
        setUsers([]);
        return;
      }

      // Get user IDs
      const userIds = followData.map(item => 
        type === 'followers' ? item.follower_id : item.following_id
      );

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, profile_picture_url, is_private')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Check which users the current user is following (for privacy logic)
      let followingMap: Record<string, boolean> = {};
      if (currentUserId) {
        const { data: followingData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', userIds);

        if (followingData) {
          followingMap = followingData.reduce((acc, item) => {
            acc[item.following_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }

      // Combine data
      const usersWithStatus: UserWithFollowStatus[] = profilesData.map(profile => ({
        ...profile,
        isFollowing: followingMap[profile.user_id] || false,
      }));

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showLockIcon = (user: UserWithFollowStatus) => {
    // Show lock if private and not following and not current user
    return user.is_private && !user.isFollowing && user.user_id !== currentUserId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'followers' ? 'Followers' : 'Following'}
            {!loading && ` (${filteredUsers.length})`}
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <User size={48} className="mx-auto mb-3 opacity-50" />
              <p>
                {searchQuery.trim() 
                  ? 'No users found' 
                  : type === 'followers' ? 'No followers yet' : 'Not following anyone yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <Link
                  key={user.user_id}
                  to={`/profile/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-lg overflow-hidden">
                      {user.profile_picture_url ? (
                        <img
                          src={user.profile_picture_url}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.display_name?.[0] || user.username[0]
                      )}
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {user.display_name}
                      </p>
                      {showLockIcon(user) && (
                        <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>

                  {/* Visual indicator for clickable */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersFollowingModal;
