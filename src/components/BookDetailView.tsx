import { Book, Comment } from "@/types";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { BookImageSection } from "./book-detail/BookImageSection";
import { BookReactions } from "./book-detail/BookReactions";
import { BookComments } from "./book-detail/BookComments";
import { BookLendingControls } from "./book-detail/BookLendingControls";
import { Button } from "./ui/button";
import { MapPin, Edit } from "lucide-react";
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

interface BookDetailViewProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookDetailView({ book, onLend, onReturn, onClose }: BookDetailViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [visibleComments, setVisibleComments] = useState(2);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedBook, setEditedBook] = useState(book);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('book_comments')
        .select(`
          id,
          comment,
          created_at,
          profiles (
            full_name,
            email
          )
        `)
        .eq('book_id', book.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data.map(d => ({
        id: d.id,
        comment: d.comment,
        createdAt: d.created_at,
        user: {
          fullName: d.profiles?.full_name,
          email: d.profiles?.email || ''
        }
      })));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (newComment: string) => {
    try {
      const { error } = await supabase
        .from('book_comments')
        .insert([
          {
            book_id: book.id,
            comment: newComment.trim(),
            user_id: user?.id
          }
        ]);

      if (error) throw error;

      fetchComments();

      await supabase.functions.invoke('generate-summary', {
        body: { bookId: book.id }
      });

      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (reactionName: string) => {
    if (!user) return;
    
    try {
      const { data: existingReaction, error: fetchError } = await supabase
        .from('book_reactions')
        .select('id')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .eq('reaction', reactionName)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('book_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) throw deleteError;

        toast({
          title: "Success",
          description: "Reaction removed!",
        });
      } else {
        const { error: insertError } = await supabase
          .from('book_reactions')
          .insert([
            {
              book_id: book.id,
              user_id: user.id,
              reaction: reactionName
            }
          ]);

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Reaction added!",
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      setShowEditDialog(false);
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

  useEffect(() => {
    fetchComments();
  }, []);

  const showMoreComments = () => {
    setVisibleComments(prev => prev + 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{book.location}</span>
        </div>
        <Button
          variant="default"
          onClick={() => setShowEditDialog(true)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Book
        </Button>
      </div>

      <BookLendingControls
        book={book}
        onLend={onLend}
        onReturn={onReturn}
        onClose={onClose}
      />

      <BookImageSection book={book} />
      <BookReactions 
        userReactions={book.userReactions} 
        reactions={book.reactions}
        onReaction={handleReaction} 
      />
      
      <div>
        <BookComments 
          comments={comments.slice(0, visibleComments)}
          isLoading={isLoadingComments}
          onAddComment={handleAddComment}
          bookId={book.id}
        />
        {comments.length > visibleComments && (
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={showMoreComments}
          >
            Show More Comments
          </Button>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
