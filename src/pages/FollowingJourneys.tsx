import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, MoreVertical, Eye, EyeOff, Globe, BookOpen, Plus, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/ui/navigation';
import { useBookJourney } from '@/hooks/useBookJourney';

interface FollowedBook {
  id: string;
  book_title: string;
  book_author: string;
  followed_at: string;
  notification_enabled: boolean;
}

const FollowingJourneys: React.FC = () => {
  const navigate = useNavigate();
  const [followedBooks, setFollowedBooks] = useState<FollowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchFollowedBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('followed_books')
        .select('*')
        .eq('user_id', user.id)
        .order('followed_at', { ascending: false });

      if (error) throw error;
      setFollowedBooks(data || []);
    } catch (error) {
      console.error('Error fetching followed books:', error);
      toast.error('Failed to load following journeys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowedBooks();
  }, []);

  const handleUnfollowBook = async (bookId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('followed_books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      setFollowedBooks(prev => prev.filter(book => book.id !== bookId));
      toast.success('Unfollowed book journey');
    } catch (error) {
      console.error('Error unfollowing book:', error);
      toast.error('Failed to unfollow book');
    }
  };

  const handleBookClick = async (title: string, author: string) => {
    try {
      // Find matching book in user_books table
      const { data: books, error } = await supabase
        .from('user_books')
        .select('id')
        .eq('title', title)
        .eq('author', author)
        .limit(1);

      if (error) throw error;

      if (books && books.length > 0) {
        navigate(`/book/${books[0].id}`);
      } else {
        // Fallback: search by title only
        const { data: titleBooks, error: titleError } = await supabase
          .from('user_books')
          .select('id')
          .eq('title', title)
          .limit(1);

        if (titleError) throw titleError;

        if (titleBooks && titleBooks.length > 0) {
          navigate(`/book/${titleBooks[0].id}`);
        } else {
          toast.error('Book details not found');
        }
      }
    } catch (error) {
      console.error('Error finding book:', error);
      toast.error('Failed to load book details');
    }
  };

  const toggleNotifications = async (bookId: string, currentState: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('followed_books')
        .update({ notification_enabled: !currentState })
        .eq('id', bookId);

      if (error) throw error;

      setFollowedBooks(prev => 
        prev.map(book => 
          book.id === bookId 
            ? { ...book, notification_enabled: !currentState }
            : book
        )
      );

      toast.success(
        !currentState 
          ? 'Journey notifications enabled' 
          : 'Journey notifications disabled'
      );
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notifications');
    }
  };

  const BookJourneyInfo: React.FC<{ title: string; author: string }> = ({ title, author }) => {
    const { journeyPoints, loading: journeyLoading } = useBookJourney(title, author);
    
    const recentActivity = journeyPoints.length > 0 
      ? journeyPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    const totalLocations = new Set(journeyPoints.map(p => `${p.city}, ${p.country}`)).size;
    
    return (
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <span className="flex items-center">
          <Globe className="h-4 w-4 mr-1" />
          {totalLocations} locations
        </span>
        <span className="flex items-center">
          <BookOpen className="h-4 w-4 mr-1" />
          {journeyPoints.length} journeys
        </span>
        {recentActivity && (
          <span className="flex items-center">
            📍 {recentActivity.city}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Header - Centered */}
          <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4">
              Following Journeys
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
              Track the books you're following as they travel across the world
            </p>
          </div>

          {/* View Mode Toggle - Centered below header */}
          <div className="flex justify-center mb-8">
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

          {followedBooks.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No journeys followed yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start following book journeys to see their adventures around the world!
                </p>
                <Button onClick={() => navigate('/explore')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Explore Books
                </Button>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {followedBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleBookClick(book.book_title, book.book_author)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {book.book_title}
                        </h3>
                        <p className="text-muted-foreground text-sm truncate">
                          by {book.book_author}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => toggleNotifications(book.id, book.notification_enabled, e)}
                          >
                            {book.notification_enabled ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Disable Notifications
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Enable Notifications
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleUnfollowBook(book.id, e)}
                            className="text-destructive"
                          >
                            Unfollow Journey
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <BookJourneyInfo title={book.book_title} author={book.book_author} />
                    
                    <div className="flex justify-between items-center mt-4">
                      <Badge variant={book.notification_enabled ? "default" : "secondary"} className="text-xs">
                        {book.notification_enabled ? 'Notifications On' : 'Notifications Off'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Following since {new Date(book.followed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingJourneys;