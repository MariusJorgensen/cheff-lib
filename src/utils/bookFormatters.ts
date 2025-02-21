
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
  
  // Get the borrower's display name from the active loan
  let lentTo = null;
  let loanDate = null;
  
  if (activeLoan) {
    lentTo = activeLoan.lent_to;
    loanDate = activeLoan.created_at;
  }

  // Get the name of the user who added the book
  const addedBy = book.profiles?.full_name || book.profiles?.email || 'Unknown';

  // Ensure location is one of the two valid options
  const location = book.location === 'Stockholm 🇸🇪' ? 'Stockholm 🇸🇪' : 'Oslo 🇧🇻';

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    imageUrl: book.image_url,
    lentTo,
    loanDate,
    averageRating: book.average_rating,
    aiSummary: book.ai_summary,
    userRating,
    reactions: reactionCounts,
    userReactions: bookUserReactions || [],
    location,
    loans: book.loans,
    bookDescription: book.book_description,
    authorDescription: book.author_description,
    addedBy,
    bookType: book.book_type || 'non-fiction' // Add the bookType field with a default value
  };
};
