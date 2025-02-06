import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";

interface BookCardProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
}

export function BookCard({ book, onLend, onReturn }: BookCardProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLendDialog, setShowLendDialog] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");

  const handleLendSubmit = () => {
    if (borrowerName.trim()) {
      onLend(book.id, borrowerName);
      setShowLendDialog(false);
      setBorrowerName("");
    }
  };

  return (
    <Card className="glass-card">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={book.imageUrl}
          alt={book.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
          }}
        />
      </div>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{book.title}</span>
          <Badge variant={book.lentTo ? "destructive" : "secondary"}>
            {book.lentTo ? "On Loan" : "Available"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{book.author}</span>
          </div>
          {book.lentTo && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Borrowed by: {book.lentTo}</span>
            </div>
          )}
          {book.lentTo ? (
            <>
              <Button variant="outline" onClick={() => setShowReturnDialog(true)}>
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
                    }}>
                      Confirm Return
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowLendDialog(true)}>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}