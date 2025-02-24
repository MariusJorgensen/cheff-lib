
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
        <Card className="transition-transform hover:scale-105 h-[360px] sm:h-[440px] flex flex-col bg-card/50">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Badge variant={book.lentTo ? "destructive" : "secondary"}>
                {book.lentTo ? "On Loan" : "Available"}
              </Badge>
            </div>
            <div className="h-36 sm:h-48 w-full overflow-hidden rounded-t-lg">
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
          </div>
          <CardHeader className="flex-none p-4 sm:p-6">
            <CardTitle className="text-base sm:text-2xl line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
              {book.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground min-h-[1.5rem]">
                <span className="flex-shrink-0">📝</span>
                <span className="line-clamp-1 text-sm sm:text-base">{book.author}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground min-h-[1.5rem]">
                <span className="flex-shrink-0">📚</span>
                <span className="capitalize text-sm sm:text-base">{book.bookType}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground min-h-[1.5rem]">
                <span className="flex-shrink-0">📍</span>
                <span className="text-sm sm:text-base">{book.location}</span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground pt-2 sm:pt-4">
              {totalReactions > 0 && (
                <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
              )}
            </div>
          </CardContent>
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
