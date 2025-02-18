
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
  // Fetch books with their active loans (if any)
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
        returned_at,
        created_at
      ),
      book_ratings (
        rating
      ),
      book_reactions (
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

  return booksData.map(book => formatBookData(book, userRatings, userReactions));
};

export const addBookToLibrary = async (
  title: string, 
  author: string, 
  imageUrl: string
) => {
  const { data, error } = await supabase
    .from('books')
    .insert([
      { 
        title, 
        author, 
        image_url: imageUrl || undefined,
        location: 'Oslo 🇧🇻' // Set default location
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
    location: data.location || 'Oslo 🇧🇻',
  } as Book;
};

export const lendBookToUser = async (id: number, borrowerName: string) => {
  const { error } = await supabase
    .from('loans')
    .insert([
      { book_id: id, lent_to: borrowerName }
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
