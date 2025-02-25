
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
    authorDescription?: string,
    bookType: 'fiction' | 'non-fiction' = 'non-fiction'
  ) => {
    try {
      await addBookToLibrary(title, author, imageUrl, location, bookDescription, authorDescription, bookType);
      toast({
        title: "Success",
        description: `${title} has been added to the library.`,
      });
      await refreshBooks();
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
      toast({
        title: "Success",
        description: `Book has been lent successfully.`,
      });
      await refreshBooks();
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
      toast({
        title: "Success",
        description: "Book has been returned to the library.",
      });
      await refreshBooks();
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
    if (!user) {
      setBooks([]);
      return;
    }

    console.log('Setting up realtime subscriptions for user:', user.id);
    refreshBooks();

    const channel = supabase
      .channel('book-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public',
          table: 'books',
        },
        () => {
          console.log('Books table changed, refreshing data...');
          refreshBooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
        },
        () => {
          console.log('Loans table changed, refreshing data...');
          refreshBooks();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time changes');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { books, addBook, lendBook, returnBook, refreshBooks };
}
