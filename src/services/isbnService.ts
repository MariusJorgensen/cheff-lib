
interface OpenLibraryResponse {
  isbn_13?: string[];
  isbn_10?: string[];
  title: string;
  authors?: { name: string }[];
  cover_i?: number;
}

export const lookupISBN = async (isbn: string): Promise<{
  title: string;
  author: string;
  imageUrl: string;
} | null> => {
  try {
    // Remove any hyphens or spaces from ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`);
    const data = await response.json();
    
    const bookData = data[`ISBN:${cleanISBN}`] as OpenLibraryResponse;
    
    if (!bookData) {
      console.log('No book found for ISBN:', isbn);
      return null;
    }

    const coverUrl = bookData.cover_i 
      ? `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`
      : 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b';

    return {
      title: bookData.title,
      author: bookData.authors?.[0]?.name || 'Unknown Author',
      imageUrl: coverUrl,
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
