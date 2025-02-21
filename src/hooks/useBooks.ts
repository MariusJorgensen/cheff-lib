
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
      console.log('Refreshing books with user:', user?.id);
      const booksData = await fetchBooks(user?.id);
      console.log('Refreshed books data:', booksData);
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

  const addBook = async (
    title: string, 
    author: string, 
    imageUrl: string, 
    location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻',
    bookDescription?: string,
    authorDescription?: string
  ) => {
    try {
      await addBookToLibrary(title, author, imageUrl, location, bookDescription, authorDescription);
      // Let realtime handle the update
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
      // Let realtime handle the update
      toast({
        title: "Success",
        description: `Book has been lent successfully.`,
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
      // Let realtime handle the update
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
    console.log('Setting up realtime subscriptions');
    
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
          table: 'loans'
        },
        (payload) => {
          console.log('Loans table changed:', payload);
          refreshBooks();
        }
      )
      .subscribe(status => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]); // Only re-run when user changes

  return { books, addBook, lendBook, returnBook };
}
