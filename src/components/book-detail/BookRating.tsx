
import { Book } from "@/types";
import { Star } from "lucide-react";

interface BookRatingProps {
  book: Book;
  onRate: (rating: number) => void;
}

export function BookRating({ book, onRate }: BookRatingProps) {
  const currentRating = book.userRating || 0;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-muted-foreground mb-1">
        {book.averageRating ? (
          <span>Average rating: {book.averageRating.toFixed(1)}</span>
        ) : (
          <span>No ratings yet</span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            className="relative group p-1"
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                rating <= currentRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300 group-hover:text-yellow-400"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating > 0 ? `Your rating: ${currentRating}` : "Rate this book"}
        </span>
      </div>
    </div>
  );
}
