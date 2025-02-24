
import { Comment } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BookCommentsProps {
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (comment: string) => void;
}

export function BookComments({ comments, isLoading, onAddComment }: BookCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment("");
  };

  const handleDelete = async (commentId: number) => {
    try {
      const { error } = await supabase
        .from('book_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id); // Ensures users can only delete their own comments

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully!",
      });

      // Refresh comments by triggering a re-fetch
      window.location.reload();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleSubmit}>Post</Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <span className="font-medium">
                    {comment.user.fullName || comment.user.email}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {user?.email === comment.user.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm">{comment.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No comments yet</p>
        )}
      </div>
    </div>
  );
}
