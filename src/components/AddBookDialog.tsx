
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Create a canvas to capture video frames
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Try to use the Barcode Detection API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'isbn']
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
              const isbn = barcodes[0].rawValue;
              setIsbn(isbn);
              handleIsbnLookup(isbn);
              setIsScanning(false);
              stream.getTracks().forEach(track => track.stop());
            } else {
              requestAnimationFrame(detectCode);
            }
          } catch (error) {
            console.error('Barcode detection error:', error);
            requestAnimationFrame(detectCode);
          }
        };

        detectCode();
      } else {
        // Fallback to manual capture - user can click when barcode is in view
        const captureButton = document.createElement('button');
        captureButton.textContent = 'Capture';
        captureButton.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full';
        document.body.appendChild(captureButton);

        captureButton.onclick = async () => {
          try {
            // Capture frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Clean up
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(captureButton);
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

      // Show the video feed
      const videoPreview = document.createElement('div');
      videoPreview.className = 'fixed inset-0 bg-black flex items-center justify-center z-50';
      videoPreview.appendChild(video);
      document.body.appendChild(videoPreview);

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.className = 'fixed top-4 right-4 text-white text-2xl z-50';
      closeButton.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(videoPreview);
        if (document.body.contains(closeButton)) {
          document.body.removeChild(closeButton);
        }
        setIsScanning(false);
      };
      document.body.appendChild(closeButton);

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

        // Wait for descriptions
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
