
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

  // Safety check - if book is undefined, show a loading state
  if (!book) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Ensure we have all required book properties
  const safeBook: Book = {
    ...book,
    lentTo: book.lentTo || null,
    reactions: book.reactions || {},
    userReactions: book.userReactions || [],
    loans: book.loans || [],
    bookDescription: book.bookDescription || null,
    authorDescription: book.authorDescription || null,
    bookType: book.bookType || 'non-fiction',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{safeBook.location}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEditDialog(true)}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Book
        </Button>
      </div>

      <BookLendingControls
        book={safeBook}
        onLend={onLend}
        onReturn={onReturn}
        onClose={onClose}
      />

      <BookImageSection book={safeBook} />
      
      <BookReactions 
        userReactions={safeBook.userReactions} 
        reactions={safeBook.reactions}
        onReaction={handleReaction} 
      />
      
      <div>
        <BookComments 
          comments={comments.slice(0, visibleComments)}
          isLoading={isLoadingComments}
          onAddComment={handleAddComment}
          bookId={safeBook.id}
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
        book={safeBook}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  );
}
