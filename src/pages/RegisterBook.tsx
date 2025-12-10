import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookPlus, QrCode, MapPin, Gift, Store, Users, Globe, GraduationCap, Recycle, Home, ShoppingCart, Heart, Coins, Car, Calendar, ArrowLeftRight, Printer, Book } from "lucide-react";
import { useState, useEffect } from "react";
import BookSearchInput from "@/components/common/BookSearchInput";
import EnhancedLocationSearchInput from "@/components/common/EnhancedLocationSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from 'qrcode';

const RegisterBook = () => {
  const [user, setUser] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<{ title: string; author: string; coverUrl?: string }>({ title: "", author: "" });
  const [acquisitionLocation, setAcquisitionLocation] = useState<string>("");
  const [acquisitionLocationData, setAcquisitionLocationData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [currentLocationData, setCurrentLocationData] = useState<any>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [acquisitionMethod, setAcquisitionMethod] = useState<string>("bookstore");
  const [transferNotes, setTransferNotes] = useState<string>("");
  const [previousOwner, setPreviousOwner] = useState<string>("");
  const [initialThoughts, setInitialThoughts] = useState<string>("");
  const [existingBookCode, setExistingBookCode] = useState<string>("");
  const [receivedMethod, setReceivedMethod] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateBookCode = async () => {
    setIsGeneratingCode(true);
    
    try {
      let newCode = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        newCode = generateRandomCode();
        
        // Check if code exists in database
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

        // If no data returned, the code is unique
        if (!data) {
          isUnique = true;
        }
        
        attempts++;
      }

      if (isUnique) {
        setGeneratedCode(newCode);
        
        // Generate QR code
        try {
          const qrUrl = await QRCode.toDataURL(newCode, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qrUrl);
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          toast.error('Code generated but QR code failed. Please try again.');
          return;
        }
        
        toast.success('Unique book code and QR code generated!');
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

  const registerNewBook = async () => {
    if (!user) {
      toast.error('Please log in to register a book');
      return;
    }
    
    if (!selectedBook.title || !selectedBook.author) {
      toast.error('Please select a book first');
      return;
    }
    
    if (!generatedCode) {
      toast.error('Please generate a book code first');
      return;
    }
    
    if (!acquisitionLocation) {
      toast.error('Please provide acquisition location');
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const bookData: any = {
        user_id: user.id,
        title: selectedBook.title,
        author: selectedBook.author,
        code: generatedCode,
        neighborhood: acquisitionLocationData?.neighborhood,
        district: acquisitionLocationData?.district,
        city: acquisitionLocationData?.city || acquisitionLocation,
        formatted_address: acquisitionLocationData?.formattedAddress || acquisitionLocation,
        latitude: acquisitionLocationData?.coordinates?.[0],
        longitude: acquisitionLocationData?.coordinates?.[1],
        acquisition_method: acquisitionMethod,
        previous_owner: previousOwner || null,
        notes: initialThoughts || null,
        // NOTE: cover_url is NOT stored - covers are fetched dynamically using title + author
      };
      
      const { error } = await supabase
        .from('user_books')
        .insert(bookData);
      
      if (error) throw error;
      
      toast.success('Book registered successfully! You can view it in your profile.');
      
      // Reset form
      setSelectedBook({ title: "", author: "" });
      setAcquisitionLocation("");
      setAcquisitionLocationData(null);
      setPreviousOwner("");
      setInitialThoughts("");
      setAcquisitionMethod("bookstore");
      setGeneratedCode("");
      setQrCodeUrl("");
    } catch (error) {
      console.error('Error registering book:', error);
      toast.error('Failed to register book. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const registerAsNewOwner = async () => {
    if (!user) {
      toast.error('Please log in to register as new owner');
      return;
    }
    
    if (!existingBookCode) {
      toast.error('Please enter the book code');
      return;
    }
    
    if (!currentLocation) {
      toast.error('Please provide your current location');
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // First, check if the book code exists
      const { data: existingBook, error: fetchError } = await supabase
        .from('user_books')
        .select('title, author, code, genre, tags')
        .eq('code', existingBookCode.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!existingBook) {
        toast.error('Book code not found. Please check the code and try again.');
        return;
      }
      
      // Check if user already owns this book
      const { data: alreadyOwned } = await supabase
        .from('user_books')
        .select('id')
        .eq('code', existingBookCode.toUpperCase())
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (alreadyOwned) {
        toast.error('You already own this book!');
        return;
      }
      
      // Get the previous owner's username
      const { data: prevOwnerProfile } = await supabase
        .from('user_books')
        .select('user_id')
        .eq('code', existingBookCode.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      let previousOwnerName = 'Unknown';
      if (prevOwnerProfile?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', prevOwnerProfile.user_id)
          .single();
        
        if (profileData) {
          previousOwnerName = profileData.display_name || profileData.username;
        }
      }
      
      // Register the current user as the new owner
      const newOwnerData = {
        user_id: user.id,
        title: existingBook.title,
        author: existingBook.author,
        code: existingBook.code,
        // NOTE: cover_url is NOT stored - covers are fetched dynamically using title + author
        genre: existingBook.genre,
        tags: existingBook.tags,
        neighborhood: currentLocationData?.neighborhood,
        district: currentLocationData?.district,
        city: currentLocationData?.city || currentLocation,
        formatted_address: currentLocationData?.formattedAddress || currentLocation,
        latitude: currentLocationData?.coordinates?.[0],
        longitude: currentLocationData?.coordinates?.[1],
        acquisition_method: receivedMethod || 'received',
        previous_owner: previousOwnerName,
        notes: transferNotes || null,
      };
      
      const { error: insertError } = await supabase
        .from('user_books')
        .insert(newOwnerData);
      
      if (insertError) throw insertError;
      
      toast.success(`You're now registered as the owner of "${existingBook.title}"!`);
      
      // Reset form
      setExistingBookCode("");
      setCurrentLocation("");
      setCurrentLocationData(null);
      setReceivedMethod("");
      setTransferNotes("");
    } catch (error) {
      console.error('Error registering as new owner:', error);
      toast.error('Failed to register as new owner. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const printSticker = () => {
    if (!generatedCode || !qrCodeUrl) return;
    window.print();
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
              Start your book's journey by registering it with a unique code or join an existing book's story.
            </p>
          </div>

          <Tabs defaultValue="new-book" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="new-book" className="flex items-center space-x-2">
                <BookPlus className="h-4 w-4" />
                <span>Register New Book</span>
              </TabsTrigger>
              <TabsTrigger value="existing-book" className="flex items-center space-x-2">
                <QrCode className="h-4 w-4" />
                <span>Register as New Owner</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-book">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookPlus className="h-5 w-5 text-primary" />
                    <span>Register New Book</span>
                  </CardTitle>
                  <CardDescription>
                    Create a unique tracking code for a book that doesn't have one yet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Book Information */}
                  <div className="space-y-4">
                    <BookSearchInput
                      label="Book Title"
                      placeholder="Search for the book you want to register..."
                      onBookSelect={(book) => setSelectedBook(book)}
                      initialTitle={selectedBook.title}
                      initialAuthor={selectedBook.author}
                      showAuthorField={true}
                    />
                  </div>


                  {/* Generate Code Section */}
                  <div className="space-y-3">
                    <Label>Generate Book Code</Label>
                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={generateBookCode}
                        variant="outline"
                        className="flex items-center space-x-2 w-fit"
                        disabled={isGeneratingCode}
                      >
                        <QrCode className="h-4 w-4" />
                        <span>{isGeneratingCode ? "Generating..." : "Generate Code"}</span>
                      </Button>
                      {generatedCode && qrCodeUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted rounded-md w-full max-w-full overflow-hidden">
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground mb-2">Your Book Code:</span>
                            <span className="font-mono text-lg font-bold text-primary break-all">
                              {generatedCode}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground mb-2">QR Code:</span>
                            <img 
                              src={qrCodeUrl} 
                              alt={`QR Code for ${generatedCode}`}
                              className="border border-border rounded-md max-w-[150px] sm:max-w-[200px] w-auto h-auto"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <Button
                              onClick={printSticker}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-2"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print Sticker</span>
                            </Button>
                            <span className="text-xs text-muted-foreground mt-1 text-center max-w-[120px] sm:max-w-none">
                              Print beautiful sticker<br />for your book cover
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acquisition Details */}
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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

                    <div>
                      <Label htmlFor="previous-owner">Previous Owner (if applicable)</Label>
                      <Input
                        id="previous-owner"
                        placeholder="Name or username of previous owner"
                        className="mt-1"
                        value={previousOwner}
                        onChange={(e) => setPreviousOwner(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>
                    
                    <div>
                      <Label htmlFor="initial-thoughts">Notes or Initial Thoughts</Label>
                      <Textarea
                        id="initial-thoughts"
                        placeholder="Share your story on how you got this book or your initial thoughts..."
                        className="mt-1 min-h-[100px]"
                        value={initialThoughts}
                        onChange={(e) => setInitialThoughts(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    onClick={registerNewBook}
                    disabled={isRegistering || !generatedCode || !selectedBook.title || !acquisitionLocation || !user}
                  >
                    {isRegistering ? "Registering..." : "Register New Book"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="existing-book">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <span>Register as New Owner</span>
                  </CardTitle>
                  <CardDescription>
                    Enter the book code to register yourself as the next owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="existing-code">Enter Book Code</Label>
                    <Input
                      id="existing-code"
                      placeholder="e.g., AB12CD34"
                      className="mt-1 font-mono text-lg uppercase"
                      maxLength={8}
                      value={existingBookCode}
                      onChange={(e) => setExistingBookCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <EnhancedLocationSearchInput
                    label="Your Current Location"
                    placeholder="Search for neighborhood, city, or region..."
                    value={currentLocation}
                    onChange={(location, inputValue) => {
                      setCurrentLocation(inputValue);
                      setCurrentLocationData(location);
                    }}
                  />

                  <div>
                    <Label htmlFor="how-received">How did you receive this book?</Label>
                    <Select value={receivedMethod} onValueChange={setReceivedMethod}>
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

                  <div>
                    <Label htmlFor="transfer-notes">Notes about receiving this book</Label>
                    <Textarea
                      id="transfer-notes"
                      placeholder="Share the story of how you came to own this book..."
                      className="mt-1 min-h-[100px]"
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    onClick={registerAsNewOwner}
                    disabled={isRegistering || !existingBookCode || !currentLocation || !user}
                  >
                    {isRegistering ? "Registering..." : "Register as New Owner"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
      {generatedCode && qrCodeUrl && (
        <div className="print-only fixed inset-0 flex items-center justify-center bg-white">
          <div className="sticker-print">
            <div className="decorative-corner corner-tl"></div>
            <div className="decorative-corner corner-tr"></div>
            <div className="decorative-corner corner-bl"></div>
            <div className="decorative-corner corner-br"></div>
            
            <div className="header">
              <div className="logo-container">
                <Book className="book-icon" strokeWidth={2} />
                <div className="logo">Book Passing</div>
              </div>
              <div className="tagline">Track Your Book's Journey</div>
            </div>
            
            <div className="qr-container">
              <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
            </div>
            
            <div className="code-section">
              <div className="code-label">Book Code</div>
              <div className="code">{generatedCode}</div>
            </div>
            
            <div className="footer">
              Scan or enter code at bookpassing.app
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterBook;