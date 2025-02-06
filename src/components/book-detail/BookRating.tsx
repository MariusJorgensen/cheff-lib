
import { Book } from "@/types";
import { Star, StarHalf, StarOff } from "lucide-react";

interface BookRatingProps {
  book: Book;
  onRate: (rating: number) => void;
}

export function BookRating({ book, onRate }: BookRatingProps) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          className="text-yellow-500 hover:text-yellow-600 transition-colors"
        >
          {rating <= (book.averageRating || 0) ? (
            <Star className="h-5 w-5 fill-current" />
          ) : rating - 0.5 <= (book.averageRating || 0) ? (
            <StarHalf className="h-5 w-5 fill-current" />
          ) : (
            <StarOff className="h-5 w-5" />
          )}
        </button>
      ))}
      {book.averageRating && (
        <span className="text-sm text-muted-foreground">
          ({book.averageRating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
