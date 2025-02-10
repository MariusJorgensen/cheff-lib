
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, MapPin } from "lucide-react";
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
      <Card className="glass-card cursor-pointer transition-transform hover:scale-105 h-[440px] flex flex-col">
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <Badge variant={book.lentTo ? "destructive" : "secondary"}>
              {book.lentTo ? "On Loan" : "Available"}
            </Badge>
          </div>
          <div 
            className="h-48 w-full overflow-hidden rounded-t-lg" 
            onClick={() => setShowDetailDialog(true)}
          >
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
        <CardHeader className="flex-none">
          <CardTitle className="line-clamp-2 min-h-[3.5rem]">{book.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground min-h-[1.5rem]">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{book.author}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground min-h-[1.5rem]">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{book.location}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground pt-4">
            {totalReactions > 0 && (
              <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
            )}
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
