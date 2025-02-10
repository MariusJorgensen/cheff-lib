
import { useState, useEffect } from "react";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { 
  fetchBooks, 
  addBookToLibrary, 
  lendBookToUser, 
  returnBookToLibrary 
} from "@/services/bookService";

export function useBooks(user: User | null) {
  const [books, setBooks] = useState<Book[]>([]);
  const { toast } = useToast();

  const refreshBooks = async () => {
    try {
      const booksData = await fetchBooks(user?.id);
      setBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addBook = async (title: string, author: string, imageUrl: string) => {
    try {
      const newBook = await addBookToLibrary(title, author, imageUrl);
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
      await lendBookToUser(id, borrowerName);
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
      await returnBookToLibrary(id);
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
    refreshBooks();

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
        (payload) => {
          console.log('Books table changed:', payload);
          refreshBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_ratings'
        },
        (payload) => {
          console.log('Ratings changed:', payload);
          refreshBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_reactions'
        },
        (payload) => {
          console.log('Reactions changed:', payload);
          refreshBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans'
        },
        (payload) => {
          console.log('Loans changed:', payload);
          refreshBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { books, addBook, lendBook, returnBook };
}
