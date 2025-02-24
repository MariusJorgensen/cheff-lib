
import { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/AuthProvider';

export function useBookComments(bookId: number) {
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
        .eq('book_id', bookId)
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
            book_id: bookId,
            comment: newComment.trim(),
            user_id: user?.id
          }
        ]);

      if (error) throw error;

      fetchComments();

      await supabase.functions.invoke('generate-summary', {
        body: { bookId }
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

  const showMoreComments = () => {
    setVisibleComments(prev => prev + 5);
  };

  useEffect(() => {
    fetchComments();
  }, [bookId]);

  return {
    comments,
    isLoadingComments,
    visibleComments,
    handleAddComment,
    showMoreComments
  };
}
