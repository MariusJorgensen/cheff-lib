
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
    console.log('Generating descriptions for:', bookInfo.title);
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
      console.error('Error generating descriptions:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Received descriptions:', data);
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
    
    console.log('Looking up ISBN:', cleanISBN);
    
    // First get the book metadata from Google Books
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items?.[0]) {
      console.log('No book found for ISBN:', isbn);
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    console.log('Found book info:', bookInfo);
    
    // First return basic info
    const basicInfo = {
      title: bookInfo.title,
      author: bookInfo.authors?.[0] || 'Unknown Author',
      imageUrl: bookInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 'https://placehold.co/400x600?text=No+Cover+Available',
    };

    // Then generate descriptions
    const descriptions = await generateDescriptions(bookInfo);
    
    // Return complete info
    return {
      ...basicInfo,
      bookDescription: descriptions?.bookDescription,
      authorDescription: descriptions?.authorDescription,
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};

