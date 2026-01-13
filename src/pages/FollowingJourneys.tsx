import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MoreVertical, Globe, BookOpen, Plus, Grid, List, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { useBookJourney } from '@/hooks/useBookJourney';
import { BookCover } from '@/utils/bookCovers';
import { motion } from 'framer-motion';
import { logger } from '@/utils/logger';

interface FollowedBook {
  id: string;
  book_title: string;
  book_author: string;
  followed_at: string;
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
      logger.error('Error fetching followed books:', error);
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
      logger.error('Error unfollowing book:', error);
      toast.error('Failed to unfollow book');
    }
  };

  const handleBookClick = async (title: string, author: string) => {
    try {
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
      logger.error('Error finding book:', error);
      toast.error('Failed to load book details');
    }
  };

  const BookJourneyInfo: React.FC<{ title: string; author: string }> = ({ title, author }) => {
    const { journeyPoints, loading: journeyLoading } = useBookJourney(title, author);
    
    const recentActivity = journeyPoints.length > 0 
      ? journeyPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    const uniqueCountries = new Set(journeyPoints.map(p => p.country)).size;
    const uniqueOwners = new Set(journeyPoints.map(p => p.owner.username)).size;
    
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center">
            <Globe className="h-4 w-4 mr-1" />
            {uniqueCountries} {uniqueCountries === 1 ? 'country' : 'countries'}
          </span>
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {uniqueOwners} {uniqueOwners === 1 ? 'owner' : 'owners'}
          </span>
          <span className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {journeyPoints.length} {journeyPoints.length === 1 ? 'journey' : 'journeys'}
          </span>
        </div>
        {recentActivity && (
          <div className="text-sm text-muted-foreground">
            <span>Latest: </span>
            <span className="text-foreground font-medium">{recentActivity.city}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <ScrollRestoreLayout className="min-h-screen bg-background" scrollKey="following-journeys">
        <div className="pt-8 pb-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4 mx-auto"></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-4">
                    <div className="h-40 bg-muted-foreground/10 rounded mb-4"></div>
                    <div className="h-5 bg-muted-foreground/10 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollRestoreLayout>
    );
  }

  return (
    <ScrollRestoreLayout className="min-h-screen bg-background" scrollKey="following-journeys">
      <div className="pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4">
              Following Journeys
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
              Track the books you're following as they travel across the world
            </p>
          </div>

          {/* View Mode Toggle */}
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
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {followedBooks.map((book, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={book.id}
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 cursor-pointer group"
                  onClick={() => handleBookClick(book.book_title, book.book_author)}
                >
                  {/* Book Cover with Dropdown */}
                  <div className="relative mb-4">
                    <div className="w-full h-40 rounded-md overflow-hidden flex items-center justify-center bg-muted">
                      <BookCover 
                        title={book.book_title}
                        author={book.book_author}
                        size="M"
                      />
                    </div>
                    
                    {/* Dropdown Menu - outside overflow container */}
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 bg-background/80 hover:bg-background shadow-sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50" collisionPadding={8}>
                          <DropdownMenuItem 
                            onClick={(e) => handleUnfollowBook(book.id, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            Unfollow Journey
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Book Info */}
                  <h3 className="font-serif font-medium text-lg text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {book.book_title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">by {book.book_author}</p>
                  
                  {/* Journey Stats */}
                  <BookJourneyInfo title={book.book_title} author={book.book_author} />
                  
                  {/* Following Since */}
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    Following since {new Date(book.followed_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {followedBooks.map((book, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={book.id}
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 cursor-pointer group"
                  onClick={() => handleBookClick(book.book_title, book.book_author)}
                >
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="relative w-16 h-24 rounded-md flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                      <BookCover 
                        title={book.book_title}
                        author={book.book_author}
                        size="S"
                      />
                    </div>
                    
                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif font-medium text-lg text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {book.book_title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3">by {book.book_author}</p>
                        </div>
                        
                        {/* Dropdown Menu */}
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50" collisionPadding={8}>
                            <DropdownMenuItem 
                              onClick={(e) => handleUnfollowBook(book.id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              Unfollow Journey
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Journey Stats */}
                      <BookJourneyInfo title={book.book_title} author={book.book_author} />
                      
                      {/* Following Since */}
                      <div className="mt-3 text-xs text-muted-foreground">
                        Following since {new Date(book.followed_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollRestoreLayout>
  );
};

export default FollowingJourneys;
