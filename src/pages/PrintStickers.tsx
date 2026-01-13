import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookSearchInput from "@/components/common/BookSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Printer, Loader2, BookOpen, QrCode, AlertCircle } from "lucide-react";
import QRCode from "qrcode";

interface BookData {
  title: string;
  author: string;
  coverUrl: string;
}

interface GeneratedSticker {
  code: string;
  qrDataUrl: string;
}

const PrintStickers = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [stickerCountInput, setStickerCountInput] = useState<string>("8");
  const [paperFormat, setPaperFormat] = useState<string>("a4");
  const [stickerFormat, setStickerFormat] = useState<string>("sheet");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStickers, setGeneratedStickers] = useState<GeneratedSticker[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const MAX_STICKERS = 500;
  
  // Get sticker count as number, default to 0 if empty
  const stickerCount = parseInt(stickerCountInput) || 0;
  
  // Stickers per page based on format
  const getStickersPerPage = () => {
    if (stickerFormat === "individual") return 1;
    switch (paperFormat) {
      case "a4": return 8;
      case "letter": return 6;
      case "4x6": return 2;
      default: return 8;
    }
  };
  
  const STICKERS_PER_PAGE = getStickersPerPage();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const generateRandomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const checkCodeUniqueness = async (code: string): Promise<boolean> => {
    // Check in user_books table
    const { data: userBookData } = await supabase
      .from('user_books')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (userBookData) return false;

    // Check in book_codes table
    const { data: bookCodeData } = await supabase
      .from('book_codes')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    return !bookCodeData;
  };

  const generateUniqueCode = async (): Promise<string> => {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateRandomCode();
      isUnique = await checkCodeUniqueness(code);
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique code after multiple attempts');
    }

    return code!;
  };

  const generateQRCode = async (code: string): Promise<string> => {
    const scanUrl = `${window.location.origin}/scan/${code}`;
    return await QRCode.toDataURL(scanUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  };

  const handleGenerateStickers = async () => {
    if (!selectedBook || !user) {
      toast({
        title: "Error",
        description: "Please select a book first",
        variant: "destructive"
      });
      return;
    }

    const count = parseInt(stickerCountInput) || 0;
    if (count < 1 || count > MAX_STICKERS) {
      toast({
        title: "Error",
        description: `Please enter a number between 1 and ${MAX_STICKERS}`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedStickers([]);

    try {
      const codes: string[] = [];
      const stickers: GeneratedSticker[] = [];

      // Generate all unique codes first
      for (let i = 0; i < stickerCount; i++) {
        const code = await generateUniqueCode();
        codes.push(code);
      }

      // Batch insert all codes to database
      const { error: insertError } = await supabase
        .from('book_codes')
        .insert(
          codes.map(code => ({
            code,
            title: selectedBook.title,
            author: selectedBook.author,
            cover_url: selectedBook.coverUrl || null,
            created_by: user.id
          }))
        );

      if (insertError) {
        throw insertError;
      }

      // Generate QR codes for display
      for (const code of codes) {
        const qrDataUrl = await generateQRCode(code);
        stickers.push({ code, qrDataUrl });
      }

      setGeneratedStickers(stickers);
      
      toast({
        title: "Success!",
        description: `Generated ${stickerCount} stickers for "${selectedBook.title}"`
      });
    } catch (error: any) {
      console.error('Error generating stickers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate stickers",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Add print class to body
    document.body.classList.add('print-bulk-mode');
    
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-bulk-mode');
      setIsPrinting(false);
    }, 100);
  };

  const handleBookSelect = (book: { title: string; author: string; coverUrl: string }) => {
    setSelectedBook(book);
    setGeneratedStickers([]); // Clear any previously generated stickers
  };

  const pagesNeeded = Math.ceil(stickerCount / STICKERS_PER_PAGE);

  // Split stickers into pages of 8
  const stickerPages: GeneratedSticker[][] = [];
  for (let i = 0; i < generatedStickers.length; i += STICKERS_PER_PAGE) {
    stickerPages.push(generatedStickers.slice(i, i + STICKERS_PER_PAGE));
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Screen content - hidden when printing */}
      <div className="container mx-auto px-4 py-8 max-w-4xl print:hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Print Bulk Stickers</h1>
          <p className="text-muted-foreground">
            Generate multiple stickers for a book. Each sticker will have a unique code that can be claimed by the finder.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Book Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Book
              </CardTitle>
              <CardDescription>
                Search for the book you want to create stickers for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookSearchInput
                onBookSelect={handleBookSelect}
                placeholder="Search for a book..."
              />
              
              {selectedBook && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center gap-4">
                  {selectedBook.coverUrl && (
                    <img 
                      src={selectedBook.coverUrl} 
                      alt={selectedBook.title}
                      className="w-16 h-24 object-cover rounded shadow-sm"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{selectedBook.title}</p>
                    <p className="text-sm text-muted-foreground">by {selectedBook.author}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sticker Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Sticker Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stickerCount">Number of Stickers</Label>
                  <Input
                    id="stickerCount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={stickerCountInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || parseInt(value) <= MAX_STICKERS) {
                        setStickerCountInput(value);
                      }
                    }}
                    onBlur={() => {
                      if (stickerCountInput === '' || parseInt(stickerCountInput) < 1) {
                        setStickerCountInput('1');
                      }
                    }}
                    placeholder="Enter number of stickers"
                  />
                  <p className="text-xs text-muted-foreground">Maximum: {MAX_STICKERS} stickers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stickerFormat">Print Format</Label>
                  <Select value={stickerFormat} onValueChange={setStickerFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="sheet">Paper Sheet (cut after printing)</SelectItem>
                      <SelectItem value="individual">Sticker Printer (one at a time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {stickerFormat === "sheet" && (
                  <div className="space-y-2">
                    <Label htmlFor="paperFormat">Paper Size</Label>
                    <Select value={paperFormat} onValueChange={setPaperFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="a4">A4 (8 stickers per page)</SelectItem>
                        <SelectItem value="letter">US Letter (6 stickers per page)</SelectItem>
                        <SelectItem value="4x6">4×6" Photo (2 stickers)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {stickerCount > 0 ? pagesNeeded : 0} page{pagesNeeded !== 1 ? 's' : ''} needed
                    </p>
                  </div>
                )}

                {stickerFormat === "individual" && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Each sticker prints individually at 2" × 2.5" (51mm × 64mm). Compatible with most label printers like Dymo, Brother, etc.
                    </p>
                  </div>
                )}
              </div>

              {stickerFormat === "sheet" && (
                <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Each sticker will be approximately 2" × 2.5" (5cm × 6.5cm). Cut along the grid lines after printing.
                  </p>
                </div>
              )}

              <Button
                onClick={handleGenerateStickers}
                disabled={!selectedBook || isGenerating || stickerCount < 1}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating {stickerCount} stickers...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate {stickerCount} Stickers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview & Print */}
          {generatedStickers.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    {generatedStickers.length} stickers generated ({stickerPages.length} page{stickerPages.length !== 1 ? 's' : ''})
                  </CardDescription>
                </div>
                <Button onClick={handlePrint} disabled={isPrinting}>
                  {isPrinting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print All Stickers
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {generatedStickers.slice(0, 16).map((sticker, index) => (
                    <div 
                      key={sticker.code}
                      className="border border-border rounded-lg p-2 flex flex-col items-center bg-white"
                    >
                      <img 
                        src={sticker.qrDataUrl} 
                        alt={`QR Code ${sticker.code}`}
                        className="w-16 h-16"
                      />
                      <p className="text-xs font-mono mt-1 text-foreground">{sticker.code}</p>
                    </div>
                  ))}
                  {generatedStickers.length > 16 && (
                    <div className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center col-span-2 md:col-span-4">
                      <p className="text-sm text-muted-foreground">
                        +{generatedStickers.length - 16} more stickers (visible when printed)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print Layout - Only visible when printing */}
      <div className="hidden print:block">
        {stickerFormat === "individual" ? (
          // Individual sticker format for label printers
          generatedStickers.map((sticker) => (
            <div key={sticker.code} className="print-individual-sticker">
              <div className="print-individual-inner">
                <div className="print-individual-header">
                  <span>📚 BookTrail</span>
                </div>
                <div className="print-individual-book">
                  <p className="print-individual-title">{selectedBook?.title}</p>
                  <p className="print-individual-author">by {selectedBook?.author}</p>
                </div>
                <div className="print-individual-qr">
                  <img src={sticker.qrDataUrl} alt={`QR ${sticker.code}`} />
                </div>
                <div className="print-individual-code">{sticker.code}</div>
                <div className="print-individual-footer">Scan to join!</div>
              </div>
            </div>
          ))
        ) : (
          // Sheet format for regular printers
          stickerPages.map((page, pageIndex) => (
            <div 
              key={pageIndex} 
              className={`print-bulk-page print-bulk-page-${paperFormat}`}
            >
              {page.map((sticker) => (
                <div key={sticker.code} className="print-bulk-sticker">
                  <div className="print-bulk-sticker-inner">
                    <div className="print-bulk-header">
                      <span className="print-bulk-logo">📚 BookTrail</span>
                    </div>
                    
                    <div className="print-bulk-book-info">
                      <p className="print-bulk-title">{selectedBook?.title}</p>
                      <p className="print-bulk-author">by {selectedBook?.author}</p>
                    </div>
                    
                    <div className="print-bulk-qr">
                      <img src={sticker.qrDataUrl} alt={`QR ${sticker.code}`} />
                    </div>
                    
                    <div className="print-bulk-code">
                      <span>{sticker.code}</span>
                    </div>
                    
                    <div className="print-bulk-footer">
                      <span>Scan to join this book's journey!</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Fill empty slots on last page */}
              {pageIndex === stickerPages.length - 1 && page.length < STICKERS_PER_PAGE && (
                Array(STICKERS_PER_PAGE - page.length).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="print-bulk-sticker print-bulk-sticker-empty"></div>
                ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrintStickers;
