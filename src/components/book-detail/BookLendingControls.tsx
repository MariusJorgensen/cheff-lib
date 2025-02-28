
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface BookLendingControlsProps {
  book: Book;
  onLend: (id: number, userId: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookLendingControls({ book, onLend, onReturn, onClose }: BookLendingControlsProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLendDialog, setShowLendDialog] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleLendSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to borrow books",
        variant: "destructive",
      });
      return;
    }

    try {
      await onLend(book.id, user.id);
      setShowLendDialog(false);
    } catch (error) {
      console.error('Error processing loan:', error);
      toast({
        title: "Error",
        description: "Failed to process borrowing request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReturnSubmit = async () => {
    try {
      await onReturn(book.id);
      setShowReturnDialog(false);
    } catch (error) {
      console.error('Error returning book:', error);
      toast({
        title: "Error",
        description: "Failed to return book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isCurrentBorrower = user && book.loans?.some(loan => 
    !loan.returned_at && loan.user_id === user.id
  );
  const canReturnBook = isAdmin || isCurrentBorrower;

  return book.lentTo ? (
    <>
      {canReturnBook && (
        <Button variant="secondary" onClick={() => setShowReturnDialog(true)} className="w-full">
          Return Book
        </Button>
      )}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{book.title}" as returned from {book.lentTo}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReturnDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnSubmit}>
              Confirm Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ) : (
    <>
      <Button variant="default" onClick={() => setShowLendDialog(true)} className="w-full">
        Borrow Book
      </Button>
      <AlertDialog open={showLendDialog} onOpenChange={setShowLendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrow Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to borrow "{book.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLendDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLendSubmit}>
              Confirm Borrow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
