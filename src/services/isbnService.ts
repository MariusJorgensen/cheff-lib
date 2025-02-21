
interface GoogleBooksResponse {
  items?: {
    volumeInfo: {
      title: string;
      authors?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      description?: string;
    };
  }[];
}

const generateDescriptions = async (bookInfo: any) => {
  try {
    const response = await fetch('https://tmpjozfsriqsezobfvhh.supabase.co/functions/v1/generate-book-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: bookInfo.title,
        author: bookInfo.authors?.[0] || 'Unknown Author',
        description: bookInfo.description || ''
      })
    });

    if (!response.ok) {
      console.error('Error generating descriptions');
      return null;
    }

    const data = await response.json();
    return {
      bookDescription: data.bookDescription,
      authorDescription: data.authorDescription
    };
  } catch (error) {
    console.error('Error generating descriptions:', error);
    return null;
  }
};

export const lookupISBN = async (isbn: string): Promise<{
  title: string;
  author: string;
  imageUrl: string;
  bookDescription?: string;
  authorDescription?: string;
} | null> => {
  try {
    // Remove any hyphens or spaces from ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // First get the book metadata from Google Books (most reliable for this)
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items?.[0]) {
      console.log('No book found for ISBN:', isbn);
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    
    // Generate descriptions using ChatGPT
    const descriptions = await generateDescriptions(bookInfo);
    
    return {
      title: bookInfo.title,
      author: bookInfo.authors?.[0] || 'Unknown Author',
      imageUrl: bookInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 'https://placehold.co/400x600?text=No+Cover+Available',
      bookDescription: descriptions?.bookDescription,
      authorDescription: descriptions?.authorDescription,
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
