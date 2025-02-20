
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
  const [showLendDialog, setShowLendDialog] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleLendSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to lend books",
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
        setShowLendDialog(false);
        onClose();
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      toast({
        title: "Error",
        description: "Failed to process lending request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Only admins can return books
  const canReturnBook = isAdmin;

  return book.lentTo ? (
    <>
      {canReturnBook && (
        <Button variant="outline" onClick={() => setShowReturnDialog(true)} className="w-full">
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
      <Button variant="outline" onClick={() => setShowLendDialog(true)} className="w-full">
        Lend Book
      </Button>
      <AlertDialog open={showLendDialog} onOpenChange={setShowLendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lend Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lend "{book.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLendSubmit}>
              Confirm Loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
