
import { Book } from "@/types";

export const formatBookData = (
  book: any, 
  userRatings: any[] | null, 
  userReactions: any[] | null
): Book => {
  const reactionCounts: { [key: string]: number } = {};
  book.book_reactions?.forEach((r: { reaction: string }) => {
    reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
  });

  const userRating = userRatings?.find(r => r.book_id === book.id)?.rating;

  const bookUserReactions = userReactions
    ?.filter(r => r.book_id === book.id)
    .map(r => r.reaction);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    imageUrl: book.image_url,
    lentTo: book.loans && book.loans.length > 0 && !book.loans[0].returned_at
      ? book.loans[0].lent_to
      : null,
    averageRating: book.average_rating,
    aiSummary: book.ai_summary,
    userRating,
    reactions: reactionCounts,
    userReactions: bookUserReactions || [],
    location: book.location || 'Oslo 🇧🇻',
  };
};
