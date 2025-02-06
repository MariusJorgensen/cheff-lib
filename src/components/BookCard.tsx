import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";

interface BookCardProps {
  book: Book;
  onLend: (id: number) => void;
  onReturn: (id: number) => void;
}

export function BookCard({ book, onLend, onReturn }: BookCardProps) {
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
          <Button
            variant="outline"
            onClick={() => (book.lentTo ? onReturn(book.id) : onLend(book.id))}
          >
            {book.lentTo ? "Return Book" : "Lend Book"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}