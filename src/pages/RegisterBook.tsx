import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookPlus, QrCode, MapPin, Gift, Store, Users, Globe, GraduationCap, Recycle, Home, ShoppingCart, Heart, Coins, Car, Calendar, ArrowLeftRight, Printer, Book, FileText, Loader2, CheckCircle2, Search, X, RotateCcw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import BookSearchInput from "@/components/common/BookSearchInput";
import EnhancedLocationSearchInput from "@/components/common/EnhancedLocationSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from 'qrcode';
import { BookCover } from "@/utils/bookCovers";

type BookCodeMode = 'not-set' | 'checking' | 'new' | 'existing';

interface ExistingBookInfo {
  title: string;
  author: string;
  city: string | null;
  currentOwnerName: string;
  currentOwnerId: string;
  genre: string | null;
  tags: string[] | null;
}

const RegisterBook = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  
  // Unified code state
  const [bookCode, setBookCode] = useState<string>("");
  const [bookCodeMode, setBookCodeMode] = useState<BookCodeMode>('not-set');
  const [existingBookInfo, setExistingBookInfo] = useState<ExistingBookInfo | null>(null);
  
  // QR code state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  
  // Book details for new books
  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; coverUrl?: string }>({ title: "", author: "" });
  
  // Unified acquisition details
  const [acquisitionLocation, setAcquisitionLocation] = useState<string>("");
  const [acquisitionLocationData, setAcquisitionLocationData] = useState<any>(null);
  const [acquisitionMethod, setAcquisitionMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Loading states
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);

  // Get URL params for pre-filling
  const urlCode = searchParams.get('code');

  const SESSION_STORAGE_KEY = 'bookpassing_generated_code';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Restore from sessionStorage on mount (if no URL code)
  useEffect(() => {
    if (!urlCode) {
      const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedData) {
        try {
          const { code, qrCodeUrl: savedQrUrl } = JSON.parse(savedData);
          if (code) {
            setBookCode(code);
            setQrCodeUrl(savedQrUrl || "");
            setBookCodeMode('new');
          }
        } catch (e) {
          console.error('Error parsing saved code:', e);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Pre-fill code from URL params and trigger lookup
  useEffect(() => {
    if (urlCode && urlCode !== bookCode) {
      const upperCode = urlCode.toUpperCase();
      setBookCode(upperCode);
      lookupBookCode(upperCode);
    }
  }, [urlCode]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const lookupBookCode = useCallback(async (code: string) => {
    if (!code || code.length !== 8) {
      setBookCodeMode('not-set');
      setExistingBookInfo(null);
      return;
    }

    setIsLookingUp(true);
    setBookCodeMode('checking');

    try {
      // Check if the code exists
      const { data: existingBook, error } = await supabase
        .from('user_books')
        .select('title, author, city, user_id, genre, tags')
        .eq('code', code.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error looking up book code:', error);
        setBookCodeMode('not-set');
        return;
      }

      if (existingBook) {
        // Fetch current owner's profile
        let ownerName = 'Unknown';
        if (existingBook.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', existingBook.user_id)
            .maybeSingle();
          
          if (profileData) {
            ownerName = profileData.display_name || profileData.username;
          }
        }

        setExistingBookInfo({
          title: existingBook.title,
          author: existingBook.author,
          city: existingBook.city,
          currentOwnerName: ownerName,
          currentOwnerId: existingBook.user_id,
          genre: existingBook.genre,
          tags: existingBook.tags,
        });
        setBookCodeMode('existing');
      } else {
        setExistingBookInfo(null);
        setBookCodeMode('new');
      }
    } catch (error) {
      console.error('Error looking up book code:', error);
      setBookCodeMode('not-set');
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setBookCode(upperValue);
    
    // Clear existing info when code changes
    if (upperValue.length < 8) {
      setBookCodeMode('not-set');
      setExistingBookInfo(null);
      setQrCodeUrl("");
    }
  };

  const handleCodeBlur = () => {
    if (bookCode.length === 8) {
      lookupBookCode(bookCode);
    }
  };

  const generateNewCode = async () => {
    setIsGeneratingCode(true);
    
    try {
      let newCode = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        newCode = generateRandomCode();
        
        const { data, error } = await supabase
          .from('user_books')
          .select('code')
          .eq('code', newCode)
          .maybeSingle();

        if (error) {
          console.error('Error checking code uniqueness:', error);
          toast.error('Error generating code. Please try again.');
          return;
        }

        if (!data) {
          isUnique = true;
        }
        
        attempts++;
      }

      if (isUnique) {
        setBookCode(newCode);
        setBookCodeMode('new');
        setExistingBookInfo(null);
        
        // Generate QR code
        try {
          const bookUrl = `https://bookpassing.com/scan/${newCode}`;
          const qrUrl = await QRCode.toDataURL(bookUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qrUrl);
          
          // Save to sessionStorage for persistence
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            code: newCode,
            qrCodeUrl: qrUrl,
            timestamp: Date.now()
          }));
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          toast.error('Code generated but QR code failed.');
          return;
        }
        
        toast.success('Unique book code generated!');
      } else {
        toast.error('Unable to generate unique code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating book code:', error);
      toast.error('Error generating code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const registerBook = async () => {
    if (!user) {
      toast.error('Please log in to register a book');
      return;
    }

    if (!bookCode) {
      toast.error('Please enter or generate a book code');
      return;
    }

    if (!acquisitionLocation) {
      toast.error('Please provide where you got this book');
      return;
    }

    setIsRegistering(true);

    try {
      if (bookCodeMode === 'new') {
        // Register new book
        if (!selectedBook.title || !selectedBook.author) {
          toast.error('Please select a book first');
          setIsRegistering(false);
          return;
        }

        const bookData = {
          user_id: user.id,
          title: selectedBook.title,
          author: selectedBook.author,
          code: bookCode,
          neighborhood: acquisitionLocationData?.neighborhood,
          district: acquisitionLocationData?.district,
          city: acquisitionLocationData?.city || acquisitionLocation,
          formatted_address: acquisitionLocationData?.formattedAddress || acquisitionLocation,
          latitude: acquisitionLocationData?.coordinates?.[0],
          longitude: acquisitionLocationData?.coordinates?.[1],
          acquisition_method: acquisitionMethod || 'bookstore',
          notes: notes || null,
        };

        const { error } = await supabase
          .from('user_books')
          .insert(bookData);

        if (error) throw error;

        toast.success('Book registered! Its journey begins now.');
        resetForm();

      } else if (bookCodeMode === 'existing' && existingBookInfo) {
        // Check if user has EVER owned this book (not just currently)
        const { data: everOwned, error: checkError } = await supabase
          .from('user_books')
          .select('id')
          .eq('code', bookCode)
          .eq('user_id', user.id);

        if (checkError) throw checkError;

        if (everOwned && everOwned.length > 0) {
          toast.error('You have already owned this book in the past. A book can only pass through each person once.');
          setIsRegistering(false);
          return;
        }

        // Register as new owner
        const newOwnerData = {
          user_id: user.id,
          title: existingBookInfo.title,
          author: existingBookInfo.author,
          code: bookCode,
          genre: existingBookInfo.genre,
          tags: existingBookInfo.tags,
          neighborhood: acquisitionLocationData?.neighborhood,
          district: acquisitionLocationData?.district,
          city: acquisitionLocationData?.city || acquisitionLocation,
          formatted_address: acquisitionLocationData?.formattedAddress || acquisitionLocation,
          latitude: acquisitionLocationData?.coordinates?.[0],
          longitude: acquisitionLocationData?.coordinates?.[1],
          acquisition_method: acquisitionMethod || 'received',
          previous_owner: existingBookInfo.currentOwnerName,
          notes: notes || null,
        };

        const { error } = await supabase
          .from('user_books')
          .insert(newOwnerData);

        if (error) throw error;

        toast.success(`You're now the owner of "${existingBookInfo.title}"! The journey continues.`);
        resetForm();
      }
    } catch (error) {
      console.error('Error registering book:', error);
      toast.error('Failed to register book. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const resetForm = () => {
    setBookCode("");
    setBookCodeMode('not-set');
    setExistingBookInfo(null);
    setQrCodeUrl("");
    setSelectedBook({ title: "", author: "" });
    setAcquisitionLocation("");
    setAcquisitionLocationData(null);
    setAcquisitionMethod("");
    setNotes("");
    // Clear sessionStorage
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const clearCode = () => {
    setBookCode("");
    setBookCodeMode('not-set');
    setExistingBookInfo(null);
    setQrCodeUrl("");
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    
    // Focus back on the input for immediate typing
    setTimeout(() => {
      const inputEl = document.querySelector('input[placeholder*="Enter code"]') as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
      }
    }, 0);
  };

  const [printMode, setPrintMode] = useState<'a4' | 'label'>('a4');

  const printSticker = (mode: 'a4' | 'label') => {
    if (!bookCode || !qrCodeUrl) return;
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const getSubmitButtonText = () => {
    if (isRegistering) return "Registering...";
    if (bookCodeMode === 'existing') return "Continue This Book's Journey";
    return "Start This Book's Journey";
  };

  const isSubmitDisabled = () => {
    if (!user || !bookCode || !acquisitionLocation || isRegistering) return true;
    if (bookCodeMode === 'new' && (!selectedBook.title || !selectedBook.author)) return true;
    if (bookCodeMode === 'not-set' || bookCodeMode === 'checking') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Register Your Book
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enter a book code to continue its journey, or generate a new code to start one.
            </p>
          </div>

          <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookPlus className="h-5 w-5 text-primary" />
                <span>Book Registration</span>
              </CardTitle>
              <CardDescription>
                Enter an existing code or generate a new one to register your book
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Book Code Section */}
              <div className="space-y-3">
                <Label>Book Code</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter code (e.g., AB12CD34)"
                      className={`font-mono text-lg uppercase ${bookCode ? 'pr-16' : 'pr-10'}`}
                      maxLength={8}
                      value={bookCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onBlur={handleCodeBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && bookCode.length === 8 && !isLookingUp) {
                          e.preventDefault();
                          lookupBookCode(bookCode);
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {bookCode && (
                        <button
                          type="button"
                          onClick={clearCode}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                          title="Clear code"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      {isLookingUp && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {bookCodeMode === 'existing' && !isLookingUp && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {bookCodeMode === 'new' && !isLookingUp && bookCode.length === 8 && (
                        <Search className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => lookupBookCode(bookCode)}
                    variant="secondary"
                    className="flex items-center space-x-2 whitespace-nowrap"
                    disabled={bookCode.length !== 8 || isLookingUp}
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span>Look Up</span>
                  </Button>
                  <Button
                    onClick={generateNewCode}
                    variant="outline"
                    className="flex items-center space-x-2 whitespace-nowrap"
                    disabled={isGeneratingCode}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>{isGeneratingCode ? "Generating..." : "Generate New Code"}</span>
                  </Button>
                </div>
                
                {/* Code status message */}
                {bookCodeMode === 'checking' && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Looking up code...
                  </p>
                )}
                {bookCodeMode === 'new' && bookCode.length >= 4 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ✨ This is a new code! You'll be starting this book's journey.
                  </p>
                )}
                {bookCodeMode !== 'not-set' && bookCode && (
                  <button
                    type="button"
                    onClick={clearCode}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Start over with a different code
                  </button>
                )}
                {bookCodeMode === 'existing' && existingBookInfo && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Book found! You'll be continuing this book's journey.
                  </p>
                )}
              </div>

              {/* QR Code Display for new codes */}
              {bookCodeMode === 'new' && qrCodeUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted rounded-md">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-muted-foreground mb-2">Your Book Code:</span>
                    <span className="font-mono text-lg font-bold text-primary">
                      {bookCode}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-muted-foreground mb-2">QR Code:</span>
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR Code for ${bookCode}`}
                      className="border border-border rounded-md max-w-[150px] sm:max-w-[200px] w-auto h-auto"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">Print Sticker:</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => printSticker('a4')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>A4/Letter</span>
                      </Button>
                      <Button
                        onClick={() => printSticker('label')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Sticker Printer</span>
                      </Button>
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center">
                      A4 for regular printers<br />Sticker for label printers
                    </span>
                  </div>
                </div>
              )}

              {/* Existing Book Preview */}
              {bookCodeMode === 'existing' && existingBookInfo && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 rounded shadow-sm overflow-hidden flex-shrink-0">
                      <BookCover 
                        title={existingBookInfo.title}
                        author={existingBookInfo.author}
                        size="M"
                        className="w-full h-full"
                        fallbackClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{existingBookInfo.title}</h3>
                      <p className="text-muted-foreground text-sm">by {existingBookInfo.author}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {existingBookInfo.city && (
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            Currently in: {existingBookInfo.city}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          Current owner: {existingBookInfo.currentOwnerName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Search for new codes */}
              {bookCodeMode === 'new' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Book Details</h3>
                  <BookSearchInput
                    label="Search for your book"
                    placeholder="Search by title..."
                    onBookSelect={(book) => setSelectedBook(book)}
                    initialTitle={selectedBook.title}
                    initialAuthor={selectedBook.author}
                    showAuthorField={true}
                  />
                </div>
              )}

              {/* Acquisition Details - Always shown when code is valid */}
              {(bookCodeMode === 'new' || bookCodeMode === 'existing') && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Acquisition Details</h3>
                    
                    <EnhancedLocationSearchInput
                      label="Where did you get this book?"
                      placeholder="Search for neighborhood, city, or region..."
                      value={acquisitionLocation}
                      onChange={(location, inputValue) => {
                        setAcquisitionLocation(inputValue);
                        setAcquisitionLocationData(location);
                      }}
                    />

                    <div>
                      <Label htmlFor="acquisition-method">How did you acquire it?</Label>
                      <Select value={acquisitionMethod} onValueChange={setAcquisitionMethod}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friend">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>From a Friend</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="family">
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4" />
                              <span>From Family</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gift">
                            <div className="flex items-center space-x-2">
                              <Gift className="h-4 w-4" />
                              <span>Gift</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bookstore">
                            <div className="flex items-center space-x-2">
                              <Store className="h-4 w-4" />
                              <span>Bookstore</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="online-store">
                            <div className="flex items-center space-x-2">
                              <ShoppingCart className="h-4 w-4" />
                              <span>Online Store</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="thrift-store">
                            <div className="flex items-center space-x-2">
                              <Recycle className="h-4 w-4" />
                              <span>Thrift Store / Second-hand</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="library-sale">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Library Sale</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="yard-sale">
                            <div className="flex items-center space-x-2">
                              <Home className="h-4 w-4" />
                              <span>Yard/Garage Sale</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="flea-market">
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4" />
                              <span>Flea Market</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="book-fair">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Book Fair / Literary Event</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="book-swap">
                            <div className="flex items-center space-x-2">
                              <ArrowLeftRight className="h-4 w-4" />
                              <span>Book Swap / Exchange</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inherited">
                            <div className="flex items-center space-x-2">
                              <Coins className="h-4 w-4" />
                              <span>Inherited / Estate Sale</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="school">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>School / University</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="found">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>Found / Little Free Library</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="subscription">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>Book Subscription Box</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>
                    
                    <div>
                      <Label htmlFor="notes">
                        {bookCodeMode === 'existing' 
                          ? "Notes about receiving this book" 
                          : "Notes or initial thoughts"}
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder={bookCodeMode === 'existing'
                          ? "Share the story of how you came to own this book..."
                          : "Share your story on how you got this book or your initial thoughts..."}
                        className="mt-1 min-h-[100px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    onClick={registerBook}
                    disabled={isSubmitDisabled()}
                  >
                    {getSubmitButtonText()}
                  </Button>
                </>
              )}

              {/* Prompt to enter code when not set */}
              {bookCodeMode === 'not-set' && (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a book code above to continue its journey,<br />or generate a new code to start one.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">How Book Tracking Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Register</h3>
                <p className="text-sm text-muted-foreground">
                  Create a unique code for new books or register as owner of existing ones
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Share</h3>
                <p className="text-sm text-muted-foreground">
                  Pass the book to others and they can register as the next owner
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Track</h3>
                <p className="text-sm text-muted-foreground">
                  Watch your book's journey around the world and connect with other readers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Section - Only visible when printing */}
      {bookCode && qrCodeUrl && (
        <div className={`print-only ${printMode === 'label' ? 'print-label-mode' : 'print-a4-mode'}`}>
          <div className="sticker-wrapper">
            <div className="sticker-print">
              <div className="decorative-corner corner-tl"></div>
              <div className="decorative-corner corner-tr"></div>
              <div className="decorative-corner corner-bl"></div>
              <div className="decorative-corner corner-br"></div>
              
              <div className="header">
                <div className="logo-container">
                  <Book className="book-icon" strokeWidth={2} />
                  <div className="logo">BookPassing</div>
                </div>
                <div className="tagline">Track Your Book's Journey</div>
              </div>
              
              <div className="qr-container">
                <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
              </div>
              
              <div className="code-section">
                <div className="code-label">Book Code</div>
                <div className="code">{bookCode}</div>
              </div>
              
              <div className="footer">
                Scan or enter code at bookpassing.com
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterBook;
