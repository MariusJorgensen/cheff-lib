
import { Book } from "@/types";

export function formatBookData(
  rawBook: any,
  userRatings: any[] | null,
  userReactions: any[] | null
): Book {
  console.log('Formatting book data:', rawBook);
  
  // Get the active loan (most recent non-returned loan)
  const activeLoan = rawBook.loans?.find((loan: any) => !loan.returned_at);
  
  // Calculate average rating
  const ratings = rawBook.book_ratings || [];
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
    : null;

  // Count reactions
  const reactions = rawBook.book_reactions?.reduce((acc: Record<string, number>, reaction: any) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {}) || {};

  // Get user's reactions if available
  const userReactionsList = userReactions
    ?.filter(r => r.book_id === rawBook.id)
    ?.map(r => r.reaction) || [];

  const formattedBook: Book = {
    id: rawBook.id,
    title: rawBook.title,
    author: rawBook.author,
    imageUrl: rawBook.image_url,
    lentTo: activeLoan?.lent_to || null,
    averageRating: rawBook.average_rating || averageRating,
    aiSummary: rawBook.ai_summary,
    reactions: reactions,
    userReactions: userReactionsList,
    location: rawBook.location || 'Oslo 🇧🇻',
  };

  console.log('Formatted book:', formattedBook);
  return formattedBook;
}
