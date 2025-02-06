
import { useState, useEffect } from "react";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export function useBooks(user: User | null) {
  const [books, setBooks] = useState<Book[]>([]);
  const { toast } = useToast();

  const fetchBooks = async () => {
    try {
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          image_url,
          average_rating,
          ai_summary,
          loans (
            lent_to,
            returned_at
          ),
          book_ratings (
            rating
          ),
          book_reactions (
            reaction
          )
        `);

      if (booksError) throw booksError;

      let userRatings = null;
      let userReactions = null;

      if (user) {
        const { data: ratings } = await supabase
          .from('book_ratings')
          .select('book_id, rating')
          .eq('user_id', user.id);
        
        const { data: reactions } = await supabase
          .from('book_reactions')
          .select('book_id, reaction')
          .eq('user_id', user.id);

        userRatings = ratings;
        userReactions = reactions;
      }

      const formattedBooks: Book[] = booksData.map(book => formatBookData(book, userRatings, userReactions));
      setBooks(formattedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatBookData = (
    book: any, 
    userRatings: any[] | null, 
    userReactions: any[] | null
  ): Book => {
    const reactionCounts: { [key: string]: number } = {};
    book.book_reactions?.forEach((r: { reaction: string }) => {
      reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
    });

    const userRating = userRatings?.find(r => r.book_id === book.id)?.rating;

    const bookUserReactions = userReactions
      ?.filter(r => r.book_id === book.id)
      .map(r => r.reaction);

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      imageUrl: book.image_url,
      lentTo: book.loans && book.loans.length > 0 && !book.loans[0].returned_at
        ? book.loans[0].lent_to
        : null,
      averageRating: book.average_rating,
      aiSummary: book.ai_summary,
      userRating,
      reactions: reactionCounts,
      userReactions: bookUserReactions || [],
    };
  };

  const addBook = async (title: string, author: string, imageUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([
          { title, author, image_url: imageUrl || undefined }
        ])
        .select()
        .single();

      if (error) throw error;

      const newBook: Book = {
        id: data.id,
        title: data.title,
        author: data.author,
        imageUrl: data.image_url,
        lentTo: null,
        averageRating: null,
        aiSummary: null,
        reactions: {},
        userReactions: []
      };

      setBooks([...books, newBook]);
      toast({
        title: "Success",
        description: `${title} has been added to the library.`,
      });
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const lendBook = async (id: number, borrowerName: string) => {
    try {
      const { error } = await supabase
        .from('loans')
        .insert([
          { book_id: id, lent_to: borrowerName }
        ]);

      if (error) throw error;

      setBooks(books.map(book =>
        book.id === id ? { ...book, lentTo: borrowerName } : book
      ));
      
      toast({
        title: "Success",
        description: `Book has been lent to ${borrowerName}.`,
      });
    } catch (error) {
      console.error('Error lending book:', error);
      toast({
        title: "Error",
        description: "Failed to lend book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const returnBook = async (id: number) => {
    try {
      const { error } = await supabase
        .from('loans')
        .update({ returned_at: new Date().toISOString() })
        .eq('book_id', id)
        .is('returned_at', null);

      if (error) throw error;

      setBooks(books.map(book =>
        book.id === id ? { ...book, lentTo: null } : book
      ));
      
      toast({
        title: "Success",
        description: "Book has been returned to the library.",
      });
    } catch (error) {
      console.error('Error returning book:', error);
      toast({
        title: "Error",
        description: "Failed to return book. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBooks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('book-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        () => {
          console.log('Books table changed, refreshing...');
          fetchBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_ratings'
        },
        () => {
          console.log('Ratings changed, refreshing...');
          fetchBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_reactions'
        },
        () => {
          console.log('Reactions changed, refreshing...');
          fetchBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans'
        },
        () => {
          console.log('Loans changed, refreshing...');
          fetchBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { books, addBook, lendBook, returnBook };
}
