
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
import { supabase } from "@/integrations/supabase/client";

interface BookLendingControlsProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookLendingControls({ book, onLend, onReturn, onClose }: BookLendingControlsProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleBorrowSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to borrow books",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's profile information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const borrowerName = profile?.full_name || user.email;
      if (borrowerName) {
        onLend(book.id, borrowerName);
        setShowBorrowDialog(false);
        onClose();
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      toast({
        title: "Error",
        description: "Failed to process borrowing request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if the current user is the borrower
  const isCurrentBorrower = user?.email?.toLowerCase() === book.lentTo?.toLowerCase();
  // User can return if they're the borrower or if they're an admin
  const canReturnBook = isAdmin || isCurrentBorrower;

  return book.lentTo ? (
    <>
      {canReturnBook && (
        <Button variant="outline" onClick={() => setShowReturnDialog(true)} className="w-full">
          Return Book
        </Button>
      )}
      {!canReturnBook && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Currently borrowed by {book.lentTo}
        </div>
      )}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Book</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin && !isCurrentBorrower 
                ? `Are you sure you want to return "${book.title}" borrowed by ${book.lentTo}?`
                : `Are you sure you want to return "${book.title}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onReturn(book.id);
              setShowReturnDialog(false);
              onClose();
            }}>
              Confirm Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={() => setShowBorrowDialog(true)} className="w-full">
        Borrow Book
      </Button>
      <AlertDialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrow Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to borrow "{book.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBorrowSubmit}>
              Confirm Borrow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
