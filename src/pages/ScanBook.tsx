import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, MapPin, User, Calendar, ArrowRight, QrCode } from 'lucide-react';
import Navigation from '@/components/ui/navigation';
import { BookCover } from '@/utils/bookCovers';

interface BookInfo {
  id: string;
  title: string;
  author: string;
  code: string;
  city: string | null;
  neighborhood: string | null;
  created_at: string;
  owner_username?: string;
  owner_display_name?: string;
}

const ScanBook: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [book, setBook] = useState<BookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);

      // If not logged in, redirect to auth with return URL
      if (!user) {
        navigate(`/auth?redirect=/scan/${code}`);
        return;
      }
    };

    checkAuth();
  }, [code, navigate]);

  useEffect(() => {
    const fetchBook = async () => {
      if (!authChecked || !user || !code) return;

      setLoading(true);
      try {
        // Look for the book by code
        const { data: bookData, error } = await supabase
          .from('user_books')
          .select('id, title, author, code, city, neighborhood, created_at, user_id')
          .eq('code', code.toUpperCase())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching book:', error);
          // Book not found, redirect to register new book with code pre-filled
          navigate(`/register-book?code=${code}&tab=new-book`);
          return;
        }

        if (!bookData) {
          // Book doesn't exist, redirect to register new book
          navigate(`/register-book?code=${code}&tab=new-book`);
          return;
        }

        // Fetch owner profile
        let ownerInfo = { username: 'Unknown', display_name: null };
        if (bookData.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', bookData.user_id)
            .maybeSingle();

          if (profileData) {
            ownerInfo = profileData;
          }
        }

        setBook({
          ...bookData,
          owner_username: ownerInfo.username,
          owner_display_name: ownerInfo.display_name,
        });
      } catch (err) {
        console.error('Error:', err);
        navigate(`/register-book?code=${code}&tab=new-book`);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [authChecked, user, code, navigate]);

  const handleRegisterAsOwner = () => {
    if (book) {
      navigate(`/register-book?code=${book.code}&tab=existing-book`);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 md:pt-28 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-32 mx-auto" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">{book.code}</span>
              </div>
              <CardTitle className="text-2xl">{book.title}</CardTitle>
              <CardDescription className="text-base">by {book.author}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Book Cover */}
              <div className="flex justify-center">
                <BookCover
                  title={book.title}
                  author={book.author}
                  size="M"
                  className="w-32 h-48 rounded-lg shadow-md"
                />
              </div>

              {/* Book Journey Info */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Current Journey
                </h3>
                
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <span>
                    Currently with <strong>{book.owner_display_name || book.owner_username}</strong>
                  </span>
                </div>

                {(book.city || book.neighborhood) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{book.neighborhood ? `${book.neighborhood}, ${book.city}` : book.city}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Last registered {new Date(book.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-4">
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Did you receive this book?</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Register yourself as the new owner to continue this book's journey and add your story.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-primary hover:shadow-glow"
                  size="lg"
                  onClick={handleRegisterAsOwner}
                >
                  Register as New Owner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScanBook;
