import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, MapPin, Clock, ArrowLeft, Loader2, Check } from 'lucide-react';
import Navigation from "@/components/ui/navigation";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BookJourneyMap from '../components/BookJourneyMap';
import BookStoryTimeline from '../components/book/BookStoryTimeline';
import BookLegacyStats from '../components/book/BookLegacyStats';
import { formatGenreLabel } from '@/lib/utils';
import { useBookJourney } from '@/hooks/useBookJourney';
import { useFollowingBooks } from '@/hooks/useFollowingBooks';
import { useBookStats } from '@/hooks/useBookStats';
import { useBookStories } from '@/hooks/useBookStories';
import { BookCover } from '@/utils/bookCovers';

interface BookDetailsData {
  id: string;
  title: string;
  author: string;
  genre: string;
  cover_url?: string;
}

interface CurrentOwnerData {
  city: string;
  neighborhood?: string;
  district?: string;
  formatted_address?: string;
  notes: string;
  tags: string[];
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
  };
}

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState<BookDetailsData | null>(null);
  const [currentOwner, setCurrentOwner] = useState<CurrentOwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch journey data for this book
  const { journeyPoints, loading: journeyLoading } = useBookJourney(book?.title, book?.author);
  const { isBookFollowed, toggleFollow } = useFollowingBooks();
  const { followersCount, totalComments, totalReactions } = useBookStats(book?.title, book?.author);
  const { stories, ownerUserIds, loading: storiesLoading } = useBookStories(book?.title, book?.author);

  const handleGoBack = () => {
    const from = (location.state as any)?.from as string | undefined;
    console.log('[BookDetails] handleGoBack', { from, historyLength: window.history.length, current: location.pathname });
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/explore', { replace: true });
  };

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_books')
          .select(`
            id,
            title,
            author,
            genre,
            city,
            neighborhood,
            district,
            formatted_address,
            notes,
            tags,
            created_at,
            cover_url,
            user_id
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Set book info (title, author, genre, cover)
        setBook({
          id: data.id,
          title: data.title,
          author: data.author,
          genre: data.genre || 'Unknown',
          cover_url: data.cover_url,
        });

        // Fetch the CURRENT (most recent) owner of this book
        const { data: currentOwnerData } = await supabase
          .from('user_books')
          .select(`
            id,
            city,
            neighborhood,
            district,
            formatted_address,
            created_at,
            notes,
            tags,
            user_id
          `)
          .eq('title', data.title)
          .eq('author', data.author)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (currentOwnerData) {
          // Fetch current owner's profile
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', currentOwnerData.user_id)
            .maybeSingle();

          setCurrentOwner({
            city: currentOwnerData.city || 'Unknown',
            neighborhood: currentOwnerData.neighborhood,
            district: currentOwnerData.district,
            formatted_address: currentOwnerData.formatted_address,
            notes: currentOwnerData.notes || '',
            tags: currentOwnerData.tags || [],
            created_at: currentOwnerData.created_at,
            profile: {
              username: ownerProfile?.username || 'unknown',
              display_name: ownerProfile?.display_name || 'Unknown User'
            }
          });
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleFollowClick = async () => {
    if (!book) return;
    await toggleFollow(book.title, book.author);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading book details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-20 pb-12">
        <button 
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back</span>
        </button>
          <div className="bg-card rounded-lg shadow-card p-6 border-destructive">
            <p className="text-destructive">
              {error || 'Book not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-7xl">
        {/* Back button */}
        <button 
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Book info - Mobile first, then sidebar on lg+ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 space-y-4 sm:space-y-6"
          >
            <div className="card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 mb-4 sm:mb-6">
                <div className="relative w-20 h-32 sm:w-24 sm:h-36 rounded-md shadow-card overflow-hidden mx-auto sm:mx-0 flex-shrink-0">
                  <BookCover 
                    title={book.title}
                    author={book.author}
                    size="L"
                    className="w-full h-full"
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left w-full">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground break-words">{book.title}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">by {book.author}</p>
                  
                  {book.genre && (
                    <div className="mt-2">
                      <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                        {formatGenreLabel(book.genre)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleFollowClick}
                className={`w-full gap-2 ${isBookFollowed(book.title, book.author) ? 'border-2 border-primary text-primary bg-primary/15 hover:bg-primary/25 font-bold shadow-sm' : ''}`}
                variant={isBookFollowed(book.title, book.author) ? "outline" : "default"}
                disabled={isBookFollowed(book.title, book.author)}
              >
                {isBookFollowed(book.title, book.author) ? (
                  <>
                    <Check className="h-4 w-4 font-bold" />
                    Following
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Follow Journey
                  </>
                )}
              </Button>
            </div>
            
            {/* Current Owner Section */}
            {currentOwner && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-serif font-semibold mb-3 sm:mb-4">Current Owner</h2>
                <div className="bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border border-border/50 hover:border-primary/20 transition-colors p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg sm:text-xl shadow-sm flex-shrink-0">
                      {(currentOwner.profile.display_name || currentOwner.profile.username)[0].toUpperCase()}
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <Link 
                        to={`/profile/${currentOwner.profile.username}`} 
                        className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors block hover:underline break-words"
                      >
                        {currentOwner.profile.display_name || currentOwner.profile.username}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">Book Owner</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border/30">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary/70" />
                        <span className="text-sm font-medium text-muted-foreground">Current Location</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground ml-6 leading-relaxed break-words">
                        {[currentOwner.neighborhood, currentOwner.city, currentOwner.district].filter(Boolean).join(', ') || currentOwner.formatted_address || 'Unknown Location'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary/70" />
                        <span className="text-sm font-medium text-muted-foreground">Owned Since</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground ml-6">
                        {new Date(currentOwner.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {currentOwner.notes && (
                  <div className="mt-3 sm:mt-4">
                    <h3 className="font-medium mb-2">Owner's Story</h3>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg leading-relaxed break-words">
                      "{currentOwner.notes}"
                    </p>
                  </div>
                )}
                
                {currentOwner.tags && currentOwner.tags.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentOwner.tags.map((tag, index) => (
                        <span key={index} className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs break-words">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Main content - Enhanced Journey Experience */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8 space-y-4 sm:space-y-6"
          >
            <div className="bg-card rounded-lg shadow-book overflow-hidden border border-border">
              <Tabs defaultValue="map" className="w-full">
                <div className="p-4 sm:p-6 border-b border-border">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="map" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <span className="hidden sm:inline">Journey Map</span>
                      <span className="sm:hidden">Map</span>
                    </TabsTrigger>
                    <TabsTrigger value="stories" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <span className="hidden sm:inline">Story Timeline</span>
                      <span className="sm:hidden">Stories</span>
                    </TabsTrigger>
                    <TabsTrigger value="legacy" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                      <span className="hidden sm:inline">Legacy & Stats</span>
                      <span className="sm:hidden">Stats</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4 sm:p-6">
                  <TabsContent value="map" className="mt-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-semibold mb-4 sm:mb-6">Book's Journey Map</h2>
                      {journeyLoading ? (
                        <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
                          <Loader2 className="animate-spin h-8 w-8 text-primary" />
                          <span className="ml-2 text-muted-foreground text-sm">Loading journey map...</span>
                        </div>
                      ) : journeyPoints.length > 0 ? (
                        <BookJourneyMap 
                          journeyPoints={journeyPoints}
                          className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden"
                        />
                      ) : (
                        <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-muted/30 rounded-lg">
                          <div className="text-center p-4">
                            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                            <p className="text-muted-foreground text-sm sm:text-base">No journey data available for this book</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This book hasn't traveled to different locations yet.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="stories" className="mt-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-semibold mb-4 sm:mb-6">Story Timeline</h2>
                      <BookStoryTimeline 
                        entries={stories}
                        loading={storiesLoading}
                        allowedUserIds={ownerUserIds}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="legacy" className="mt-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-semibold mb-4 sm:mb-6">Legacy & Impact</h2>
                      <BookLegacyStats
                        journeyPoints={journeyPoints}
                        followersCount={followersCount}
                        totalComments={totalComments}
                        totalReactions={totalReactions}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </div>

        {/* Owners Modal - Remove since we're using single owner now */}
      </div>
    </div>
  );
};

export default BookDetails;