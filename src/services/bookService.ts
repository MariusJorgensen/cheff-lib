
import { supabase } from "@/integrations/supabase/client";
import { formatBookData } from "@/utils/bookFormatters";
import { Book } from "@/types";

export const fetchUserRatingsAndReactions = async (userId: string) => {
  console.log('Fetching user ratings and reactions for userId:', userId);
  
  const { data: ratings, error: ratingsError } = await supabase
    .from('book_ratings')
    .select('book_id, rating')
    .eq('user_id', userId);
    
  if (ratingsError) {
    console.error('Error fetching ratings:', ratingsError);
  } else {
    console.log('Fetched ratings:', ratings);
  }
  
  const { data: reactions, error: reactionsError } = await supabase
    .from('book_reactions')
    .select('book_id, reaction')
    .eq('user_id', userId);
    
  if (reactionsError) {
    console.error('Error fetching reactions:', reactionsError);
  } else {
    console.log('Fetched reactions:', reactions);
  }

  return { ratings, reactions };
};

export const fetchBooks = async (userId: string | undefined = undefined) => {
  console.log('Starting fetchBooks with userId:', userId);
  
  try {
    // Fetch books and their related data
    console.log('Executing Supabase query for books...');
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select(`
        *,
        loans (
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

    if (booksError) {
      console.error('Supabase error when fetching books:', booksError);
      console.error('Error details:', {
        message: booksError.message,
        details: booksError.details,
        hint: booksError.hint
      });
      throw booksError;
    }

    console.log('Books data received:', booksData);
    console.log('Number of books fetched:', booksData?.length ?? 0);

    let userRatings = null;
    let userReactions = null;

    if (userId) {
      console.log('Fetching user-specific data for userId:', userId);
      const userData = await fetchUserRatingsAndReactions(userId);
      userRatings = userData.ratings;
      userReactions = userData.reactions;
      console.log('User ratings:', userRatings);
      console.log('User reactions:', userReactions);
    }

    const formattedBooks = booksData.map(book => {
      console.log('Formatting book:', book.title);
      return formatBookData(book, userRatings, userReactions);
    });

    console.log('Returning formatted books:', formattedBooks);
    return formattedBooks;
  } catch (error) {
    console.error('Caught error in fetchBooks:', error);
    console.error('Error stack:', (error as Error).stack);
    throw error;
  }
};

export const addBookToLibrary = async (
  title: string, 
  author: string, 
  imageUrl: string,
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻'
) => {
  console.log('Adding book to library:', { title, author, imageUrl, location });
  
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

  if (error) {
    console.error('Error adding book:', error);
    throw error;
  }

  console.log('Successfully added book:', data);

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

export const lendBookToUser = async (id: number, borrowerName: string) => {
  console.log('Lending book:', { id, borrowerName });
  
  const { error } = await supabase
    .from('loans')
    .insert([
      { book_id: id, lent_to: borrowerName }
    ]);

  if (error) {
    console.error('Error lending book:', error);
    throw error;
  }

  console.log('Successfully lent book');
};

export const returnBookToLibrary = async (id: number) => {
  console.log('Returning book:', { id });
  
  const { error } = await supabase
    .from('loans')
    .update({ returned_at: new Date().toISOString() })
    .eq('book_id', id)
    .is('returned_at', null);

  if (error) {
    console.error('Error returning book:', error);
    throw error;
  }

  console.log('Successfully returned book');
};
