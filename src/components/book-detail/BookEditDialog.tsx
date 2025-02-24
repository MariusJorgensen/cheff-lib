
import { Book } from "@/types";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookEditDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookEditDialog({ book, open, onOpenChange }: BookEditDialogProps) {
  const [editedBook, setEditedBook] = useState(book);
  const { toast } = useToast();

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: editedBook.title,
          author: editedBook.author,
          image_url: editedBook.imageUrl,
          location: editedBook.location,
          book_description: editedBook.bookDescription,
          author_description: editedBook.authorDescription,
          book_type: editedBook.bookType,
        })
        .eq('id', book.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book updated successfully!",
      });
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedBook.title}
                onChange={(e) => setEditedBook(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={editedBook.author}
                onChange={(e) => setEditedBook(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={editedBook.imageUrl}
              onChange={(e) => setEditedBook(prev => ({ ...prev, imageUrl: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={editedBook.location}
                onValueChange={(value: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻') => 
                  setEditedBook(prev => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oslo 🇧🇻">Oslo 🇧🇻</SelectItem>
                  <SelectItem value="Stockholm 🇸🇪">Stockholm 🇸🇪</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookType">Book Type</Label>
              <Select
                value={editedBook.bookType}
                onValueChange={(value: 'fiction' | 'non-fiction' | 'cookbook') => 
                  setEditedBook(prev => ({ ...prev, bookType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                  <SelectItem value="cookbook">Cookbook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookDescription">Book Description</Label>
            <Textarea
              id="bookDescription"
              value={editedBook.bookDescription || ''}
              onChange={(e) => setEditedBook(prev => ({ ...prev, bookDescription: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorDescription">Author Description</Label>
            <Textarea
              id="authorDescription"
              value={editedBook.authorDescription || ''}
              onChange={(e) => setEditedBook(prev => ({ ...prev, authorDescription: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
