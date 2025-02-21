
import { supabase } from "@/integrations/supabase/client";

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
    
    const { data, error } = await supabase.functions.invoke('generate-book-descriptions', {
      body: {
        title: bookInfo.title,
        author: bookInfo.authors?.[0] || 'Unknown Author',
        description: bookInfo.description || ''
      }
    });

    if (error) {
      console.error('Error generating descriptions:', error);
      return null;
    }

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

const determineBookType = async (bookInfo: any): Promise<'fiction' | 'non-fiction'> => {
  try {
    const { data, error } = await supabase.functions.invoke('determine-book-type', {
      body: {
        title: bookInfo.title,
        description: bookInfo.description || '',
        author: bookInfo.authors?.[0] || 'Unknown Author'
      }
    });

    if (error || !data) {
      console.error('Error determining book type:', error);
      return 'non-fiction'; // Default to non-fiction if there's an error
    }

    return data.bookType;
  } catch (error) {
    console.error('Error determining book type:', error);
    return 'non-fiction';
  }
};

export const lookupISBN = async (isbn: string): Promise<{
  title: string;
  author: string;
  imageUrl: string;
  bookDescription?: string;
  authorDescription?: string;
  bookType: 'fiction' | 'non-fiction';
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

    // Generate descriptions and determine book type in parallel
    const [descriptions, bookType] = await Promise.all([
      generateDescriptions(bookInfo),
      determineBookType(bookInfo)
    ]);
    
    // Return complete info
    return {
      ...basicInfo,
      bookDescription: descriptions?.bookDescription,
      authorDescription: descriptions?.authorDescription,
      bookType
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
