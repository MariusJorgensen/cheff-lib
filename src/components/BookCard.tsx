
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Star } from "lucide-react";
import { useState } from "react";
import { BookDetailView } from "./BookDetailView";

interface BookCardProps {
  book: Book;
  onLend: (id: number, borrowerName: string) => void;
  onReturn: (id: number) => void;
}

export function BookCard({ book, onLend, onReturn }: BookCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Count total reactions
  const totalReactions = Object.values(book.reactions || {}).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <Card 
        className="glass-card cursor-pointer transition-transform hover:scale-105"
        onClick={() => setShowDetailDialog(true)}
      >
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={book.imageUrl}
            alt={book.title}
            className="h-full w-full object-cover"
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

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{book.averageRating ? book.averageRating.toFixed(1) : "No ratings"}</span>
              </div>
              <div>
                {totalReactions > 0 && (
                  <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{book.title}</DialogTitle>
          </DialogHeader>
          <BookDetailView 
            book={book} 
            onLend={onLend} 
            onReturn={onReturn} 
            onClose={() => setShowDetailDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
