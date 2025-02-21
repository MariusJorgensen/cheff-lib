import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, Loader2, Camera } from "lucide-react";
import { lookupISBN } from "@/services/isbnService";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddBookDialogProps {
  onAddBook: (
    title: string, 
    author: string, 
    imageUrl: string, 
    location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻',
    bookDescription?: string,
    authorDescription?: string
  ) => void;
}

export function AddBookDialog({ onAddBook }: AddBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState<'Stockholm 🇸🇪' | 'Oslo 🇧🇻'>('Oslo 🇧🇻');
  const [bookDescription, setBookDescription] = useState("");
  const [authorDescription, setAuthorDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: [
            'qr_code',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'code_93',
            'data_matrix',
            'itf',
            'isbn'
          ]
        });

        const detectCode = async () => {
          if (!isScanning) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes.length > 0) {
              console.log('Detected barcodes:', barcodes); // Debug log
              const isbn = barcodes[0].rawValue;
              
              // Clean up
              stream.getTracks().forEach(track => track.stop());
              const videoPreview = document.querySelector('.barcode-video-preview');
              const closeButton = document.querySelector('.barcode-close-button');
              if (videoPreview) document.body.removeChild(videoPreview);
              if (closeButton) document.body.removeChild(closeButton);
              
              setIsScanning(false);
              setIsbn(isbn);
              handleIsbnLookup(isbn);
              
              toast({
                title: "Barcode detected",
                description: `ISBN: ${isbn}`,
              });
            } else {
              // Continue scanning with a slight delay to prevent overwhelming the CPU
              setTimeout(() => {
                if (isScanning) {
                  requestAnimationFrame(detectCode);
                }
              }, 100);
            }
          } catch (error) {
            console.error('Barcode detection error:', error);
            if (isScanning) {
              requestAnimationFrame(detectCode);
            }
          }
        };

        // Start detection loop
        detectCode();
        
        // Add a debug message to confirm API is available
        console.log('BarcodeDetector API is available');
      } else {
        console.log('BarcodeDetector API is not available, falling back to manual capture');
        const captureButton = document.createElement('button');
        captureButton.textContent = 'Capture';
        captureButton.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full z-[60]';
        document.body.appendChild(captureButton);

        captureButton.onclick = async () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Clean up
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(captureButton);
            const videoPreview = document.querySelector('.barcode-video-preview');
            const closeButton = document.querySelector('.barcode-close-button');
            if (videoPreview) document.body.removeChild(videoPreview);
            if (closeButton) document.body.removeChild(closeButton);
            
            setIsScanning(false);

            toast({
              title: "Image captured",
              description: "Please enter the ISBN manually from the captured image.",
            });
          } catch (error) {
            console.error('Capture error:', error);
            toast({
              title: "Error",
              description: "Failed to capture image. Please try again or enter ISBN manually.",
              variant: "destructive",
            });
          }
        };
      }

      const videoPreview = document.createElement('div');
      videoPreview.className = 'barcode-video-preview fixed inset-0 bg-black flex items-center justify-center z-50';
      
      const container = document.createElement('div');
      container.className = 'relative w-full h-full';
      
      const scanLine = document.createElement('div');
      scanLine.className = 'absolute left-0 right-0 h-0.5 bg-red-500 z-[51] animate-scan';
      
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 z-[51]';
      overlay.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-64 h-32 border-2 border-white rounded-lg"></div>
        </div>
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-64 h-32 border-2 border-white rounded-lg bg-transparent"></div>
        </div>
      `;

      video.className = 'w-full h-full object-cover';
      
      container.appendChild(video);
      container.appendChild(scanLine);
      container.appendChild(overlay);
      videoPreview.appendChild(container);
      document.body.appendChild(videoPreview);

      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.className = 'barcode-close-button fixed top-4 right-4 text-white text-4xl z-[52] w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 hover:bg-opacity-75';
      closeButton.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(videoPreview);
        document.body.removeChild(closeButton);
        if (document.querySelector('.capture-button')) {
          document.body.removeChild(document.querySelector('.capture-button')!);
        }
        setIsScanning(false);
      };
      document.body.appendChild(closeButton);

      const style = document.createElement('style');
      style.textContent = `
        @keyframes scan {
          0% { top: 20%; }
          100% { top: 80%; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite alternate;
        }
      `;
      document.head.appendChild(style);

    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Error",
        description: "Could not access camera. Please check permissions and try again.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleIsbnLookup = async (isbnToLookup?: string) => {
    const isbnValue = isbnToLookup || isbn;
    if (!isbnValue) return;

    setIsLoading(true);
    setIsGeneratingDescriptions(true);
    try {
      const bookData = await lookupISBN(isbnValue);
      if (bookData) {
        setTitle(bookData.title);
        setAuthor(bookData.author);
        setImageUrl(bookData.imageUrl);
        
        toast({
          title: "Book found",
          description: "Basic information has been filled. Generating descriptions...",
        });

        if (bookData.bookDescription && bookData.authorDescription) {
          setBookDescription(bookData.bookDescription);
          setAuthorDescription(bookData.authorDescription);
          toast({
            title: "Descriptions generated",
            description: "Book and author descriptions have been added.",
          });
        }
      } else {
        toast({
          title: "Book not found",
          description: "No book found with this ISBN. Please enter the details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in ISBN lookup:', error);
      toast({
        title: "Error",
        description: "Failed to look up ISBN. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsGeneratingDescriptions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && author && location) {
      const finalImageUrl = imageUrl || "https://placehold.co/400x600?text=No+Cover+Available";
      onAddBook(title, author, finalImageUrl, location, bookDescription, authorDescription);
      setIsbn("");
      setTitle("");
      setAuthor("");
      setImageUrl("");
      setBookDescription("");
      setAuthorDescription("");
      setLocation('Oslo 🇧🇻');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN"
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="button" 
                onClick={() => handleIsbnLookup()}
                disabled={isLoading || !isbn}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsScanning(true);
                  startScanning();
                }}
                disabled={isLoading || isScanning}
                variant="outline"
                title="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookDescription" className="flex items-center gap-2">
              About the Book
              {isGeneratingDescriptions && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </Label>
            <Textarea
              id="bookDescription"
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              placeholder={isGeneratingDescriptions ? "Generating description..." : "Enter a description of the book"}
              className="min-h-[100px]"
              disabled={isGeneratingDescriptions}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorDescription" className="flex items-center gap-2">
              About the Author
              {isGeneratingDescriptions && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </Label>
            <Textarea
              id="authorDescription"
              value={authorDescription}
              onChange={(e) => setAuthorDescription(e.target.value)}
              placeholder={isGeneratingDescriptions ? "Generating description..." : "Enter information about the author"}
              className="min-h-[100px]"
              disabled={isGeneratingDescriptions}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select 
              value={location} 
              onValueChange={(value) => setLocation(value as 'Stockholm 🇸🇪' | 'Oslo 🇧🇻')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Oslo 🇧🇻">Oslo 🇧🇻</SelectItem>
                <SelectItem value="Stockholm 🇸🇪">Stockholm 🇸🇪</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGeneratingDescriptions}>
            Add Book
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
