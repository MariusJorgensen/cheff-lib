
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface BookLendingControlsProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
  onClose: () => void;
}

export function BookLendingControls({ book, onLend, onReturn, onClose }: BookLendingControlsProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLendDialog, setShowLendDialog] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");

  const handleLendSubmit = () => {
    if (borrowerName.trim()) {
      onLend(book.id, borrowerName);
      setShowLendDialog(false);
      setBorrowerName("");
      onClose();
    }
  };

  return book.lentTo ? (
    <>
      <Button variant="outline" onClick={() => setShowReturnDialog(true)} className="w-full">
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
  );
}
