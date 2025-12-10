import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  MapPin, 
  Users, 
  Calendar, 
  User, 
  Settings, 
  Grid, 
  List, 
  BookMarked,
  Camera,
  X,
  AlertCircle,
  Lock,
  ChevronRight,
  Upload,
  Trash2,
  MessagesSquare
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BookJourneyCard from '@/components/BookJourneyCard';
import EditProfileModal from '@/components/EditProfileModal';
import FollowersFollowingModal from '@/components/profile/FollowersFollowingModal';
import Navigation from '@/components/ui/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BookCover } from '@/utils/bookCovers';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  profile_picture_url: string;
  cover_photo_url: string;
  is_private: boolean;
  show_location: boolean;
  created_at: string;
}


interface UserBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  created_at: string;
}

interface GroupedBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  created_at: string;
  journey_count: number;
  latest_entry_date: string;
}

interface Stats {
  followers_count: number;
  following_count: number;
  books_count: number;
}

interface FollowRequestStatus {
  status: 'none' | 'pending' | 'following';
}

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [followStatus, setFollowStatus] = useState<FollowRequestStatus>({ status: 'none' });
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  
  // State for data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [groupedBooks, setGroupedBooks] = useState<GroupedBook[]>([]);
  const [stats, setStats] = useState<Stats>({
    followers_count: 0,
    following_count: 0,
    books_count: 0
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // If no username in URL, redirect to current user's profile
        if (!username && user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', user.id)
            .single();
          
          if (profileData?.username) {
            navigate(`/profile/${profileData.username}`, { replace: true });
            return;
          }
        }

        // If no user and no username, redirect to auth
        if (!username && !user) {
          navigate('/auth');
          return;
        }

        // Use username from URL or current user's username
        const targetUsername = username || 'test'; // fallback for now

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', targetUsername)
          .single();

        if (profileError || !profileData) {
          setError('Profile not found');
          return;
        }

        setProfile(profileData);

        // Check if following
        if (user && user.id !== profileData.user_id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.user_id)
            .single();

          setIsFollowing(!!followData);
          setFollowStatus({ status: followData ? 'following' : 'none' });
        }

        // Fetch stats
        const [followersCount, followingCount, booksCount] = await Promise.all([
          supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', profileData.user_id),
          supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', profileData.user_id),
          supabase.from('user_books').select('id', { count: 'exact' }).eq('user_id', profileData.user_id)
        ]);

        setStats({
          followers_count: followersCount.count || 0,
          following_count: followingCount.count || 0,
          books_count: booksCount.count || 0
        });

        // Fetch books if not private or if following
        const canViewContent = !profileData.is_private || 
                              (user && user.id === profileData.user_id) || 
                              isFollowing;

        if (canViewContent) {
          // Fetch books
          const { data: booksData } = await supabase
            .from('user_books')
            .select('*')
            .eq('user_id', profileData.user_id)
            .order('created_at', { ascending: false });

          if (booksData) {
            setBooks(booksData);
            const grouped = groupBooksByTitleAuthor(booksData);
            setGroupedBooks(grouped);
            // Update stats to reflect unique books count
            setStats(prev => ({ ...prev, books_count: grouped.length }));
          }
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, isFollowing, navigate]);
  
  
  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAvatar = async () => {
    if (!currentUser || !profile) return;

    try {
      // Update profile picture URL to null in database
      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', currentUser.id);

      if (error) {
        throw error;
      }

      setProfile(prev => prev ? {
        ...prev,
        profile_picture_url: ''
      } : null);

      toast.success('Profile picture removed');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error removing profile picture';
      setError(message);
      toast.error(message);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !profile) return;

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920
      });

      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        
        // Update profile picture URL in database
        const { error } = await supabase
          .from('profiles')
          .update({ profile_picture_url: result })
          .eq('user_id', currentUser.id);

        if (error) {
          throw error;
        }

        setProfile(prev => prev ? {
          ...prev,
          profile_picture_url: result
        } : null);

        toast.success('Profile picture updated');
      };
      reader.readAsDataURL(compressedFile);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error uploading image';
      setError(message);
      toast.error(message);
    }
  };

  const handleSaveProfile = async (data: any) => {
    if (!currentUser || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          username: data.username,
          bio: data.bio,
          location: data.location
        })
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        display_name: data.displayName,
        username: data.username,
        bio: data.bio,
        location: data.location
      } : null);

      toast.success('Profile updated successfully');
      
      // Navigate to new username URL if changed
      if (data.username !== username) {
        navigate(`/profile/${data.username}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const handleFollowAction = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.user_id);

        if (error) throw error;

        setIsFollowing(false);
        setFollowStatus({ status: 'none' });
        setStats(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.user_id
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowStatus({ status: 'following' });
        setStats(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
        toast.success('Following successfully');
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
      toast.error('Error updating follow status');
    }
  };

  const getFollowButtonText = () => {
    return isFollowing ? 'Following' : 'Follow';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupBooksByTitleAuthor = (booksData: UserBook[]): GroupedBook[] => {
    const grouped = booksData.reduce((acc, book) => {
      const key = `${book.title}::${book.author}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          created_at: book.created_at,
          journey_count: 1,
          latest_entry_date: book.created_at
        };
      } else {
        acc[key].journey_count += 1;
        // Keep the most recent entry's data for cover and other details
        if (new Date(book.created_at) > new Date(acc[key].latest_entry_date)) {
          acc[key].cover_url = book.cover_url;
          acc[key].latest_entry_date = book.created_at;
          acc[key].id = book.id; // Use the most recent entry's ID
        }
      }
      
      return acc;
    }, {} as Record<string, GroupedBook>);

    return Object.values(grouped).sort((a, b) => 
      new Date(b.latest_entry_date).getTime() - new Date(a.latest_entry_date).getTime()
    );
  };

  const isCurrentUserProfile = currentUser && profile && currentUser.id === profile.user_id;
  const canViewContent = !profile?.is_private || isCurrentUserProfile || isFollowing;

  console.log('Profile page rendering:', { profile: profile?.username, isCurrentUserProfile, currentUser: currentUser?.id });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
                <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('Rendering new profile design for:', profile?.display_name);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-lg shadow-card mb-8 overflow-hidden"
          >
            {/* Banner */}
            <div className="h-32 md:h-48 bg-gradient-primary"></div>
            
             <div className="p-6 md:p-8 pt-0">
               <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
                 {/* Avatar with upload/delete functionality */}
                 {isCurrentUserProfile ? (
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <div className="relative w-32 h-32 group cursor-pointer">
                         <div className="w-full h-full rounded-full bg-muted border-4 border-card flex items-center justify-center text-foreground font-bold text-4xl shadow-md overflow-hidden">
                           {profile.profile_picture_url ? (
                             <img 
                               src={profile.profile_picture_url} 
                               alt={profile.display_name} 
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             profile.display_name?.[0] || profile.username[0]
                           )}
                         </div>
                         
                         <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Camera size={24} className="text-white" />
                         </div>
                       </div>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-48">
                       <DropdownMenuItem onClick={handleAvatarUploadClick}>
                         <Upload className="h-4 w-4 mr-2" />
                         Upload new photo
                       </DropdownMenuItem>
                       {profile.profile_picture_url && (
                         <DropdownMenuItem 
                           onClick={handleDeleteAvatar}
                           className="text-destructive focus:text-destructive"
                         >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Remove photo
                         </DropdownMenuItem>
                       )}
                     </DropdownMenuContent>
                   </DropdownMenu>
                 ) : (
                   <div className="relative w-32 h-32">
                     <div className="w-full h-full rounded-full bg-muted border-4 border-card flex items-center justify-center text-foreground font-bold text-4xl shadow-md overflow-hidden">
                       {profile.profile_picture_url ? (
                         <img 
                           src={profile.profile_picture_url} 
                           alt={profile.display_name} 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         profile.display_name?.[0] || profile.username[0]
                       )}
                     </div>
                   </div>
                 )}
                
                 
                 {/* Hidden file input */}
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   onChange={handleAvatarUpload}
                   className="hidden"
                 />
                 
                 {/* User info */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                      {profile.display_name}
                    </h1>
                    {profile.is_private && (
                      <Lock size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                
                 {/* Action buttons */}
                 <div className="flex gap-3 mt-4 md:mt-0">
                   {isCurrentUserProfile ? (
                     <button 
                       onClick={() => setIsEditingProfile(true)}
                       className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                     >
                       <Settings size={18} />
                       <span>Edit Profile</span>
                     </button>
                   ) : (
                     <>
                       <button 
                         onClick={handleFollowAction}
                         className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                           isFollowing
                             ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                             : 'bg-primary text-primary-foreground hover:bg-primary/90'
                         }`}
                       >
                         <User size={18} />
                         <span>{getFollowButtonText()}</span>
                       </button>
                       <button 
                         onClick={async () => {
                           if (!currentUser || !profile) return;
                           try {
                             const { data, error } = await supabase.rpc('get_or_create_conversation', {
                               user1_id: currentUser.id,
                               user2_id: profile.user_id
                             });
                             if (error) throw error;
                             navigate(`/messages/${data}`);
                           } catch (err) {
                             console.error('Error starting conversation:', err);
                             toast.error('Failed to start conversation');
                           }
                         }}
                         className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        >
                          <MessagesSquare size={18} />
                          <span>Message</span>
                       </button>
                     </>
                   )}
                 </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-md">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {/* Stats Section */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <p className="text-foreground mb-4">{profile.bio}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.location && profile.show_location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                    </div>
                  </div>
                </div>
                
                 <div className="grid grid-cols-3 gap-4">
                   <div className="text-center hover:bg-accent p-4 rounded-lg transition-colors h-full flex flex-col justify-center">
                     <div className="text-2xl font-semibold text-foreground">{stats.books_count}</div>
                     <div className="text-sm text-muted-foreground">Books</div>
                   </div>
                   
                   <button
                     onClick={() => {
                       setFollowersModalType('followers');
                       setFollowersModalOpen(true);
                     }}
                     className="text-center hover:bg-accent p-4 rounded-lg transition-colors h-full flex flex-col justify-center cursor-pointer"
                   >
                     <div className="text-2xl font-semibold text-foreground">{stats.followers_count}</div>
                     <div className="text-sm text-muted-foreground">Followers</div>
                   </button>
                   
                   <button
                     onClick={() => {
                       setFollowersModalType('following');
                       setFollowersModalOpen(true);
                     }}
                     className="text-center hover:bg-accent p-4 rounded-lg transition-colors h-full flex flex-col justify-center cursor-pointer"
                   >
                     <div className="text-2xl font-semibold text-foreground">{stats.following_count}</div>
                     <div className="text-sm text-muted-foreground">Following</div>
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Show private profile message for non-followers */}
          {profile.is_private && !isCurrentUserProfile && !isFollowing && (
            <div className="mt-6 bg-muted border border-border rounded-lg p-4 text-center">
              <Lock size={24} className="mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium text-foreground mb-1">This Account is Private</h3>
              <p className="text-muted-foreground">
                Follow this account to see their books and journey.
              </p>
            </div>
          )}
          
          {/* Only show content if user can view */}
          {canViewContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
             >
                {/* Header with View toggle */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">Books</h2>
                  
                  {/* View toggle */}
                  <div className="flex bg-muted rounded-md p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Grid size={18} />
                    </button>
                    
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
               
               {/* Books Content */}
               <div className={`${
                 viewMode === 'grid'
                   ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                   : 'space-y-4'
                 }`}>
                  {groupedBooks.length > 0 ? (
                     groupedBooks.map((book) => (
                       viewMode === 'grid' ? (
                         <div 
                           key={book.id} 
                           className="bg-card rounded-lg shadow-card hover:shadow-elegant transition-shadow duration-300 p-4 cursor-pointer"
                           onClick={() => navigate(`/book/${book.id}`)}
                         >
                           <div className="relative w-full h-40 rounded-md mb-4 overflow-hidden">
                             <BookCover 
                               title={book.title}
                               author={book.author}
                               size="M"
                               className="w-full h-full"
                             />
                           </div>
                           
                            <h3 className="font-serif font-medium text-lg text-foreground mb-1 line-clamp-1">
                              {book.title}
                            </h3>
                            <p className="text-muted-foreground mb-2">{book.author}</p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Added {new Date(book.latest_entry_date).toLocaleDateString()}
                              </span>
                              {book.journey_count > 1 && (
                                 <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                   Journey: {book.journey_count}
                                 </span>
                              )}
                            </div>
                         </div>
                       ) : (
                         <div
                           key={book.id}
                           className="cursor-pointer"
                           onClick={() => navigate(`/book/${book.id}`)}
                         >
                           <BookJourneyCard 
                             book={{
                               id: book.id,
                               title: book.title,
                               author: book.author,
                               owners: book.journey_count,
                               countries: 1, // TODO: Implement actual data
                               journeyYears: 0, // TODO: Implement actual data
                               latestCity: 'Current', // TODO: Implement actual data
                               coverColor: 'bg-muted'
                             }} 
                           />
                         </div>
                       )
                     ))
                 ) : (
                   <div className="col-span-full flex items-center justify-center h-48 bg-muted rounded-lg border border-border">
                     <div className="text-center text-muted-foreground">
                       <BookMarked size={48} className="mx-auto mb-3" />
                       <p>No books yet</p>
                       <p className="text-sm mt-2">Register your first book to start tracking your journey</p>
                     </div>
                   </div>
                 )}
               </div>
             </motion.div>
          )}

          <EditProfileModal
            isOpen={isEditingProfile}
            onClose={() => setIsEditingProfile(false)}
            onSave={handleSaveProfile}
            currentData={{
              displayName: profile.display_name,
              username: profile.username,
              bio: profile.bio,
              location: profile.location,
              email: currentUser?.email || '',
            }}
          />

          <FollowersFollowingModal
            isOpen={followersModalOpen}
            onClose={() => setFollowersModalOpen(false)}
            userId={profile.user_id}
            type={followersModalType}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;