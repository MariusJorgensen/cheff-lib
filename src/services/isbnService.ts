
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

const tryGoogleBooksAPI = async (isbn: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      return null;
    }

    const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail
      .replace('http://', 'https://')
      .replace('zoom=1', 'zoom=2');

    // Test if the image actually loads
    const imgResponse = await fetch(coverUrl);
    if (!imgResponse.ok || imgResponse.headers.get('content-length') === '0') {
      return null;
    }

    return coverUrl;
  } catch (error) {
    console.error('Error with Google Books API:', error);
    return null;
  }
};

const tryOpenLibraryAPI = async (isbn: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    const data = await response.json();
    
    if (!data.covers?.[0]) {
      return null;
    }

    const coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;

    // Test if the image actually loads
    const imgResponse = await fetch(coverUrl);
    if (!imgResponse.ok || imgResponse.headers.get('content-length') === '0') {
      return null;
    }

    return coverUrl;
  } catch (error) {
    console.error('Error with OpenLibrary API:', error);
    return null;
  }
};

const tryISBDAPI = async (isbn: string): Promise<string | null> => {
  try {
    // The Dutch National Library API provides high-quality scans
    const coverUrl = `https://covers.kb.nl/isbn/${isbn}.jpg`;
    
    // Test if the image actually loads
    const imgResponse = await fetch(coverUrl);
    if (!imgResponse.ok || imgResponse.headers.get('content-length') === '0') {
      return null;
    }

    return coverUrl;
  } catch (error) {
    console.error('Error with ISBD API:', error);
    return null;
  }
};

export const lookupISBN = async (isbn: string): Promise<{
  title: string;
  author: string;
  imageUrl: string;
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
    
    // Try each image source in sequence until we find one that works
    const coverUrl = await tryGoogleBooksAPI(cleanISBN) ||
                    await tryOpenLibraryAPI(cleanISBN) ||
                    await tryISBDAPI(cleanISBN) ||
                    'https://placehold.co/400x600?text=No+Cover+Available';

    return {
      title: bookInfo.title,
      author: bookInfo.authors?.[0] || 'Unknown Author',
      imageUrl: coverUrl,
    };
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
};
