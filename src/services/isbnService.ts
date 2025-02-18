
interface GoogleBooksResponse {
  items?: {
    volumeInfo: {
      title: string;
      authors?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
    };
  }[];
}

export const lookupISBN = async (isbn: string): Promise<{
  title: string;
  author: string;
  imageUrl: string;
} | null> => {
  try {
    // Remove any hyphens or spaces from ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items?.[0]) {
      console.log('No book found for ISBN:', isbn);
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    
    // Google Books returns HTTP URLs, but we want HTTPS
    const coverUrl = bookInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 
                    'https://placehold.co/400x600?text=No+Cover+Available';

    return {
      title: bookInfo.title,
      author: bookInfo.authors?.[0] || 'Unknown Author',
      // Get a larger image by modifying the zoom parameter
      imageUrl: coverUrl.replace('zoom=1', 'zoom=2'),
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
