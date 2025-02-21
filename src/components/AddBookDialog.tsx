
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
import { PlusCircle, Search, Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  const handleIsbnLookup = async () => {
    if (!isbn) return;

    setIsLoading(true);
    try {
      const bookData = await lookupISBN(isbn);
      if (bookData) {
        setTitle(bookData.title);
        setAuthor(bookData.author);
        setImageUrl(bookData.imageUrl);
        if (bookData.bookDescription) {
          setBookDescription(bookData.bookDescription);
        }
        if (bookData.authorDescription) {
          setAuthorDescription(bookData.authorDescription);
        }
        toast({
          title: "Book found",
          description: "Book information has been filled automatically.",
        });
      } else {
        toast({
          title: "Book not found",
          description: "No book found with this ISBN. Please enter the details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to look up ISBN. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              />
              <Button 
                type="button" 
                onClick={handleIsbnLookup}
                disabled={isLoading || !isbn}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookDescription">About the Book</Label>
            <Textarea
              id="bookDescription"
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              placeholder="Enter a description of the book"
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorDescription">About the Author</Label>
            <Textarea
              id="authorDescription"
              value={authorDescription}
              onChange={(e) => setAuthorDescription(e.target.value)}
              placeholder="Enter information about the author"
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={(value) => setLocation(value as 'Stockholm 🇸🇪' | 'Oslo 🇧🇻')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Oslo 🇧🇻">Oslo 🇧🇻</SelectItem>
                <SelectItem value="Stockholm 🇸🇪">Stockholm 🇸🇪</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Add Book
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
