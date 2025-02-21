
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

  // Find the active loan (where returned_at is null)
  const activeLoan = book.loans?.find((loan: any) => !loan.returned_at);
  
  // Get the borrower's display name from the profiles data
  let lentTo = null;
  if (activeLoan) {
    if (activeLoan.profiles) {
      lentTo = activeLoan.profiles.full_name || activeLoan.profiles.email;
    } else if (activeLoan.lent_to) {
      lentTo = activeLoan.lent_to;
    }
  }

  // Ensure location is one of the two valid options
  const location = book.location === 'Stockholm 🇸🇪' ? 'Stockholm 🇸🇪' : 'Oslo 🇧🇻';

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    imageUrl: book.image_url,
    lentTo,
    loanDate: activeLoan ? activeLoan.created_at : null,
    averageRating: book.average_rating,
    aiSummary: book.ai_summary,
    userRating,
    reactions: reactionCounts,
    userReactions: bookUserReactions || [],
    location,
    loans: book.loans,
    bookDescription: book.book_description,
    authorDescription: book.author_description,
  };
};
