
import { Book } from "@/types";
import { useState } from "react";
import { BookImageSection } from "./book-detail/BookImageSection";
import { BookReactions } from "./book-detail/BookReactions";
import { BookComments } from "./book-detail/BookComments";
import { BookLendingControls } from "./book-detail/BookLendingControls";
import { BookEditDialog } from "./book-detail/BookEditDialog";
import { Button } from "./ui/button";
import { MapPin, Edit } from "lucide-react";
import { useBookComments } from "@/hooks/useBookComments";
import { useBookReactions } from "@/hooks/useBookReactions";

interface BookDetailViewProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookDetailView({ book, onLend, onReturn, onClose }: BookDetailViewProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { comments, isLoadingComments, visibleComments, handleAddComment, showMoreComments } = useBookComments(book.id);
  const { handleReaction } = useBookReactions(book.id);

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

      <BookEditDialog 
        book={book}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  );
}
