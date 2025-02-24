
import { supabase } from "@/integrations/supabase/client";
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
  console.log('Fetching books for user:', userId);
  
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select(`
      *,
      profiles!books_added_by_user_id_fkey (
        full_name,
        email
      ),
      loans (
        id,
        user_id,
        returned_at,
        created_at,
        lent_to,
        profiles!loans_user_id_fkey (
          full_name,
          email
        )
      ),
      book_ratings (
        rating,
        user_id
      ),
      book_reactions (
        reaction,
        user_id
      )
    `)
    .order('created_at', { ascending: false });

  if (booksError) {
    console.error('Error fetching books:', booksError);
    throw booksError;
  }

  let userRatings = null;
  let userReactions = null;

  if (userId) {
    const userData = await fetchUserRatingsAndReactions(userId);
    userRatings = userData.ratings;
    userReactions = userData.reactions;
  }

  // Process the books data
  const processedBooks = booksData.map(book => {
    const activeLoan = book.loans?.find((loan: any) => !loan.returned_at);
    const loanUserName = activeLoan?.profiles?.full_name || activeLoan?.profiles?.email || activeLoan?.lent_to || null;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      imageUrl: book.image_url,
      lentTo: loanUserName,
      averageRating: book.average_rating,
      aiSummary: book.ai_summary,
      addedBy: book.profiles?.full_name || book.profiles?.email || null,
      createdAt: book.created_at || null,
      userRating: userRatings?.find(r => r.book_id === book.id)?.rating || null,
      reactions: {},
      userReactions: userReactions?.filter(r => r.book_id === book.id).map(r => r.reaction) || [],
      location: book.location,
      loanDate: activeLoan?.created_at || null,
      loans: book.loans?.map(loan => ({
        user_id: loan.user_id,
        returned_at: loan.returned_at,
        lent_to: loan.profiles?.full_name || loan.profiles?.email || loan.lent_to,
        created_at: loan.created_at
      })),
      bookDescription: book.book_description,
      authorDescription: book.author_description,
      bookType: book.book_type || 'non-fiction'
    } as Book;
  });

  return processedBooks;
};

export const addBookToLibrary = async (
  title: string, 
  author: string, 
  imageUrl: string,
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻',
  bookDescription?: string,
  authorDescription?: string,
  bookType: 'fiction' | 'non-fiction' = 'non-fiction'
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('books')
    .insert([
      { 
        title, 
        author, 
        image_url: imageUrl || undefined,
        location,
        book_description: bookDescription,
        author_description: authorDescription,
        book_type: bookType,
        added_by_user_id: user?.id
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
    bookDescription: data.book_description,
    authorDescription: data.author_description,
    bookType: data.book_type,
    addedBy: null
  } as Book;
};

export const lendBookToUser = async (bookId: number, borrowerName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('loans')
    .insert([
      { 
        book_id: bookId,
        user_id: user?.id,
        lent_to: borrowerName
      }
    ]);

  if (error) throw error;
};

export const returnBookToLibrary = async (bookId: number) => {
  const { error } = await supabase
    .from('loans')
    .update({ returned_at: new Date().toISOString() })
    .eq('book_id', bookId)
    .is('returned_at', null);

  if (error) throw error;
};
