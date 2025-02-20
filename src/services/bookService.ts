
import { supabase } from "@/integrations/supabase/client";
import { formatBookData } from "@/utils/bookFormatters";
import { Book } from "@/types";

export const fetchUserRatingsAndReactions = async (userId: string) => {
  const { data: ratings } = await supabase
    .from('book_ratings')
    .select('book_id, rating')
    .eq('user_id', userId);
  
  const { data: reactions } = await supabase
    .from('book_reactions')
    .select('book_id, reaction')
    .eq('user_id', userId);

  return { ratings, reactions };
};

export const fetchBooks = async (userId: string | undefined = undefined) => {
  // Fetch books with their active loans (if any) and include user profile info
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      image_url,
      average_rating,
      ai_summary,
      location,
      loans!fk_loans_book (
        lent_to,
        user_id,
        returned_at,
        created_at,
        profiles:user_id (
          full_name,
          email
        )
      ),
      book_ratings!fk_book_ratings_book_id (
        rating
      ),
      book_reactions!fk_book_reactions_book_id (
        reaction
      )
    `);

  if (booksError) throw booksError;

  let userRatings = null;
  let userReactions = null;

  if (userId) {
    const userData = await fetchUserRatingsAndReactions(userId);
    userRatings = userData.ratings;
    userReactions = userData.reactions;
  }

  // Process the books data to include proper borrower information
  const processedBooksData = booksData.map(book => {
    const activeLoan = book.loans?.find((loan: any) => !loan.returned_at);
    if (activeLoan) {
      const userProfile = activeLoan.profiles;
      // Use full name if available, otherwise use email
      book.loans[0].lent_to = userProfile.full_name || userProfile.email;
    }
    return book;
  });

  return processedBooksData.map(book => formatBookData(book, userRatings, userReactions));
};

export const addBookToLibrary = async (
  title: string, 
  author: string, 
  imageUrl: string,
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻'
) => {
  const { data, error } = await supabase
    .from('books')
    .insert([
      { 
        title, 
        author, 
        image_url: imageUrl || undefined,
        location
      }
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    author: data.author,
    imageUrl: data.image_url,
    lentTo: null,
    averageRating: null,
    aiSummary: null,
    reactions: {},
    userReactions: [],
    location: data.location,
  } as Book;
};

export const lendBookToUser = async (bookId: number, userId: string) => {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('loans')
    .insert([
      { 
        book_id: bookId, 
        user_id: userId,
        lent_to: profile?.full_name || profile?.email
      }
    ]);

  if (error) throw error;
};

export const returnBookToLibrary = async (id: number) => {
  const { error } = await supabase
    .from('loans')
    .update({ returned_at: new Date().toISOString() })
    .eq('book_id', id)
    .is('returned_at', null);

  if (error) throw error;
};
