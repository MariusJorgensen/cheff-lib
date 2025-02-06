
import { Book } from "@/types";
import { BookOpen, User } from "lucide-react";

interface BookImageSectionProps {
  book: Book;
}

export function BookImageSection({ book }: BookImageSectionProps) {
  return (
    <div className="flex gap-4">
      <img
        src={book.imageUrl}
        alt={book.title}
        className="h-48 w-36 object-cover rounded-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
        }}
      />
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{book.author}</span>
        </div>

        {book.aiSummary && (
          <p className="text-sm italic text-muted-foreground">
            "{book.aiSummary}"
          </p>
        )}

        {book.lentTo && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Borrowed by: {book.lentTo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
