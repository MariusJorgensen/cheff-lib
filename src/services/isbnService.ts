
interface OpenLibraryResponse {
  isbn_13?: string[];
  isbn_10?: string[];
  title: string;
  authors?: { name: string }[];
  cover_i?: number;
  covers?: number[];
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

    // Try to get the cover from covers array first, then fallback to cover_i
    const coverId = bookData.covers?.[0] || bookData.cover_i;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : 'https://placehold.co/400x600?text=No+Cover+Available';

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
