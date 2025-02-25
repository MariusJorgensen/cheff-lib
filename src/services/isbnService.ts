
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

interface LibrisResponse {
  xsearch: {
    list: Array<{
      title: string;
      creator: string;
      isbn: string;
      type: string[];
    }>;
  };
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

const searchLibris = async (isbn: string) => {
  try {
    const response = await fetch(`https://libris.kb.se/xsearch?query=isbn:${isbn}&format=json`);
    const data = await response.json() as LibrisResponse;
    
    if (data.xsearch.list.length === 0) {
      return null;
    }

    const book = data.xsearch.list[0];
    return {
      title: book.title,
      author: book.creator || 'Unknown Author',
      imageUrl: 'https://placehold.co/400x600?text=No+Cover+Available', // LIBRIS doesn't provide cover images
    };
  } catch (error) {
    console.error('Error searching LIBRIS:', error);
    return null;
  }
};

const searchGoogleBooks = async (isbn: string) => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items?.[0]) {
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    return {
      title: bookInfo.title,
      author: bookInfo.authors?.[0] || 'Unknown Author',
      imageUrl: bookInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || 'https://placehold.co/400x600?text=No+Cover+Available',
      description: bookInfo.description,
      rawData: bookInfo
    };
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return null;
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
    
    // Try Google Books first
    const googleBooksResult = await searchGoogleBooks(cleanISBN);
    if (googleBooksResult) {
      console.log('Found book in Google Books:', googleBooksResult);
      
      // Generate descriptions and determine book type in parallel
      const [descriptions, bookType] = await Promise.all([
        generateDescriptions(googleBooksResult.rawData),
        determineBookType(googleBooksResult.rawData)
      ]);
      
      return {
        ...googleBooksResult,
        bookDescription: descriptions?.bookDescription,
        authorDescription: descriptions?.authorDescription,
        bookType
      };
    }

    // If not found in Google Books, try LIBRIS
    const librisResult = await searchLibris(cleanISBN);
    if (librisResult) {
      console.log('Found book in LIBRIS:', librisResult);
      
      // Generate descriptions and determine book type for LIBRIS result
      const [descriptions, bookType] = await Promise.all([
        generateDescriptions({ 
          title: librisResult.title, 
          authors: [librisResult.author],
          description: '' 
        }),
        determineBookType({ 
          title: librisResult.title, 
          authors: [librisResult.author],
          description: '' 
        })
      ]);

      return {
        ...librisResult,
        bookDescription: descriptions?.bookDescription,
        authorDescription: descriptions?.authorDescription,
        bookType
      };
    }

    console.log('No book found for ISBN:', isbn);
    return null;
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
