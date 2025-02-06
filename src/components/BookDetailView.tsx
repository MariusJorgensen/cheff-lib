
import { Book, Comment } from "@/types";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { BookImageSection } from "./book-detail/BookImageSection";
import { BookRating } from "./book-detail/BookRating";
import { BookReactions } from "./book-detail/BookReactions";
import { BookComments } from "./book-detail/BookComments";
import { BookLendingControls } from "./book-detail/BookLendingControls";

interface BookDetailViewProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookDetailView({ book, onLend, onReturn, onClose }: BookDetailViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
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
    if (!user) return;
    
    try {
      // First check if the reaction already exists
      const { data: existingReaction, error: fetchError } = await supabase
        .from('book_reactions')
        .select('id')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .eq('reaction', reactionName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw fetchError;
      }

      if (existingReaction) {
        // If reaction exists, delete it
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
        // If reaction doesn't exist, add it
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

  return (
    <div className="space-y-6">
      <BookImageSection book={book} />
      <BookRating book={book} onRate={handleRate} />
      <BookReactions userReactions={book.userReactions} onReaction={handleReaction} />
      <BookComments 
        comments={comments}
        isLoading={isLoadingComments}
        onAddComment={handleAddComment}
      />
      <BookLendingControls
        book={book}
        onLend={onLend}
        onReturn={onReturn}
        onClose={onClose}
      />
    </div>
  );
}
