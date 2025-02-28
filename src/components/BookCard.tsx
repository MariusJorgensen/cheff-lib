
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const handleCardClick = () => {
    console.log('Card clicked for book:', book.title);
    setShowDetailDialog(true);
  };

  return (
    <>
      <div 
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className="transition-transform hover:scale-105 h-[320px] sm:h-[440px] flex flex-col bg-card/50">
          <div className="relative p-2 sm:p-4">
            <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10">
              <Badge variant={book.lentTo ? "destructive" : "secondary"} className="text-xs sm:text-sm px-1.5 sm:px-2.5">
                {book.lentTo ? "On Loan" : "Available"}
              </Badge>
            </div>
            <div className="h-36 sm:h-56 w-full overflow-hidden rounded-lg bg-white">
              <img
                src={book.imageUrl}
                alt={book.title}
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
                }}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col p-2 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-1">
              <CardTitle className="text-sm sm:text-lg !leading-tight line-clamp-2 font-bold">
                {book.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <span className="flex-shrink-0 text-xs sm:text-sm">📝</span>
                <span className="line-clamp-1 text-xs sm:text-sm font-medium">{book.author}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-4">
                <Badge variant="outline" className="capitalize text-xs">
                  <span className="mr-1">📚</span>{book.bookType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <span className="mr-1">📍</span>{book.location}
                </Badge>
              </div>

              <div className="text-xs sm:text-sm text-muted-foreground pt-2 sm:pt-4 font-medium">
                {totalReactions > 0 && (
                  <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

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
