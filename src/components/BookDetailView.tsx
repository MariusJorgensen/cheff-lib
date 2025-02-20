
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
import { MapPin } from "lucide-react";

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

  useEffect(() => {
    fetchComments();
  }, []);

  const showMoreComments = () => {
    setVisibleComments(prev => prev + 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <MapPin className="h-4 w-4" />
        <span>{book.location}</span>
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
    </div>
  );
}
