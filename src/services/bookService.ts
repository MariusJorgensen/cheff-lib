
export const addBookToLibrary = async (
  title: string, 
  author: string, 
  imageUrl: string,
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻',
  bookDescription?: string,
  authorDescription?: string
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
    addedBy: null // This will be populated when the book is fetched with user details
  } as Book;
};
