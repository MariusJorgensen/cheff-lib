import { Book, Comment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  User,
  MessageSquare,
  Star,
  StarHalf,
  StarOff,
  ThumbsUp,
  Heart,
  Smile,
} from "lucide-react";

interface BookCardProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
}

const REACTIONS = [
  { emoji: "👍", name: "thumbsup" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😄", name: "smile" },
  { emoji: "🤓", name: "nerd" },
  { emoji: "📚", name: "book" },
];

export function BookCard({ book, onLend, onReturn }: BookCardProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLendDialog, setShowLendDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLendSubmit = () => {
    if (borrowerName.trim()) {
      onLend(book.id, borrowerName);
      setShowLendDialog(false);
      setBorrowerName("");
    }
  };

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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

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

      setNewComment("");
      fetchComments();

      // Generate new AI summary
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

  const handleRate = async (rating: number) => {
    try {
      const { error } = await supabase
        .from('book_ratings')
        .upsert(
          {
            book_id: book.id,
            user_id: user?.id,
            rating
          },
          {
            onConflict: 'book_id,user_id'
          }
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rating updated successfully!",
      });
    } catch (error) {
      console.error('Error rating book:', error);
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (reactionName: string) => {
    try {
      const { error } = await supabase
        .from('book_reactions')
        .upsert([
          {
            book_id: book.id,
            user_id: user?.id,
            reaction: reactionName
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reaction added!",
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (showCommentsDialog) {
      fetchComments();
    }
  }, [showCommentsDialog]);

  return (
    <Card className="glass-card">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={book.imageUrl}
          alt={book.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
          }}
        />
      </div>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{book.title}</span>
          <Badge variant={book.lentTo ? "destructive" : "secondary"}>
            {book.lentTo ? "On Loan" : "Available"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{book.author}</span>
          </div>

          {book.aiSummary && (
            <p className="text-sm italic text-muted-foreground">
              "{book.aiSummary}"
            </p>
          )}

          {book.lentTo && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Borrowed by: {book.lentTo}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className="text-yellow-500 hover:text-yellow-600 transition-colors"
              >
                {rating <= (book.averageRating || 0) ? (
                  <Star className="h-5 w-5 fill-current" />
                ) : rating - 0.5 <= (book.averageRating || 0) ? (
                  <StarHalf className="h-5 w-5 fill-current" />
                ) : (
                  <StarOff className="h-5 w-5" />
                )}
              </button>
            ))}
            {book.averageRating && (
              <span className="text-sm text-muted-foreground">
                ({book.averageRating.toFixed(1)})
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {REACTIONS.map(({ emoji, name }) => (
              <button
                key={name}
                onClick={() => handleReaction(name)}
                className={`text-2xl transition-transform hover:scale-110 ${
                  book.userReactions?.includes(name) ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comments on {book.title}</DialogTitle>
                <DialogDescription>
                  Join the discussion about this book
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>Post</Button>
                </div>

                <div className="space-y-4">
                  {isLoadingComments ? (
                    <p className="text-center text-muted-foreground">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {comment.user.fullName || comment.user.email}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No comments yet</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {book.lentTo ? (
            <>
              <Button variant="outline" onClick={() => setShowReturnDialog(true)}>
                Return Book
              </Button>
              <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Return Book</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark "{book.title}" as returned from {book.lentTo}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      onReturn(book.id);
                      setShowReturnDialog(false);
                    }}>
                      Confirm Return
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowLendDialog(true)}>
                Lend Book
              </Button>
              <AlertDialog open={showLendDialog} onOpenChange={setShowLendDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lend Book</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter the name of the person borrowing "{book.title}"
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      placeholder="Borrower's name"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && borrowerName.trim()) {
                          handleLendSubmit();
                        }
                      }}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setBorrowerName("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLendSubmit} disabled={!borrowerName.trim()}>
                      Confirm Loan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
