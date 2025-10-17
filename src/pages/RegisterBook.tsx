import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookPlus, QrCode, MapPin, Gift, Store, Users, Globe, GraduationCap, Recycle, Home, ShoppingCart, Heart, Coins, Car, Calendar, ArrowLeftRight, Printer } from "lucide-react";
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
        notes: transferNotes || null,
        cover_url: selectedBook.coverUrl || null,
      };
      
      // Coordinates are already included in bookData above
      
      const { error } = await supabase
        .from('user_books')
        .insert(bookData);
      
      if (error) throw error;
      
      toast.success('Book registered successfully!');
      
      // Reset form
      setSelectedBook({ title: "", author: "" });
      setAcquisitionLocation("");
      setAcquisitionLocationData(null);
      setTransferNotes("");
      setGeneratedCode("");
      setQrCodeUrl("");
    } catch (error) {
      console.error('Error registering book:', error);
      toast.error('Failed to register book. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const printSticker = () => {
    if (!generatedCode || !qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const stickerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Book Sticker - ${generatedCode}</title>
        <style>
          @media print {
            @page {
              size: 2.5in 2.5in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 8px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          .sticker {
            width: 2.25in;
            height: 2.25in;
            border: 2px solid #000;
            border-radius: 12px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          
          .sticker::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981);
            border-radius: 12px;
            z-index: -1;
          }
          
          .header {
            text-align: center;
            margin-bottom: 4px;
          }
          
          .logo {
            font-size: 10px;
            font-weight: bold;
            color: #1e293b;
            letter-spacing: 0.5px;
          }
          
          .tagline {
            font-size: 6px;
            color: #64748b;
            margin-top: 1px;
          }
          
          .qr-container {
            background: white;
            padding: 4px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .qr-code {
            width: 80px;
            height: 80px;
            display: block;
          }
          
          .code-section {
            text-align: center;
            background: white;
            padding: 4px 8px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            width: 100%;
            box-sizing: border-box;
          }
          
          .code-label {
            font-size: 6px;
            color: #64748b;
            margin-bottom: 2px;
          }
          
          .code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            color: #1e293b;
            letter-spacing: 1px;
          }
          
          .footer {
            font-size: 5px;
            color: #94a3b8;
            text-align: center;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="sticker">
          <div class="header">
            <div class="logo">BOOKTRACKER</div>
            <div class="tagline">Track Your Book's Journey</div>
          </div>
          
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
          </div>
          
          <div class="code-section">
            <div class="code-label">BOOK CODE</div>
            <div class="code">${generatedCode}</div>
          </div>
          
          <div class="footer">
            Scan or enter code to continue journey
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(stickerHTML);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-12">
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
                    <div className="flex gap-3">
                      <Button 
                        onClick={generateBookCode}
                        variant="outline"
                        className="flex items-center space-x-2"
                        disabled={isGeneratingCode}
                      >
                        <QrCode className="h-4 w-4" />
                        <span>{isGeneratingCode ? "Generating..." : "Generate Code"}</span>
                      </Button>
                      {generatedCode && qrCodeUrl && (
                        <div className="flex flex-col lg:flex-row items-center gap-4 p-4 bg-muted rounded-md">
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground mb-2">Your Book Code:</span>
                            <span className="font-mono text-lg font-bold text-primary">
                              {generatedCode}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground mb-2">QR Code:</span>
                            <img 
                              src={qrCodeUrl} 
                              alt={`QR Code for ${generatedCode}`}
                              className="border border-border rounded-md"
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
                            <span className="text-xs text-muted-foreground mt-1 text-center">
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
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    disabled={!generatedCode || !selectedBook.title}
                  >
                    Register New Book
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
                      className="mt-1 font-mono text-lg"
                      maxLength={8}
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
                    <Select>
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
                    onClick={registerNewBook}
                    disabled={isRegistering || !selectedBook.title || !generatedCode || !user}
                  >
                    {isRegistering ? "Registering..." : "Register New Book"}
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
    </div>
  );
};

export default RegisterBook;