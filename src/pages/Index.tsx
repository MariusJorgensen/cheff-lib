
import { useState, useEffect } from "react";
import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      // Fetch books with their loans, ratings, and reactions
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

      // Get user's own ratings if logged in
      const { data: userRatings } = await supabase
        .from('book_ratings')
        .select('book_id, rating')
        .eq('user_id', user?.id);

      // Get user's reactions if logged in
      const { data: userReactions } = await supabase
        .from('book_reactions')
        .select('book_id, reaction')
        .eq('user_id', user?.id);

      const formattedBooks: Book[] = booksData.map(book => {
        // Count reactions
        const reactionCounts: { [key: string]: number } = {};
        book.book_reactions?.forEach((r: { reaction: string }) => {
          reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
        });

        // Get user's rating for this book
        const userRating = userRatings?.find(r => r.book_id === book.id)?.rating;

        // Get user's reactions for this book
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
          userReactions: bookUserReactions,
        };
      });

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
        lentTo: null
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

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                         book.author.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ||
                         (filter === "available" && !book.lentTo) ||
                         (filter === "borrowed" && book.lentTo);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Office Library</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter books" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="borrowed">On Loan</SelectItem>
            </SelectContent>
          </Select>
          <AddBookDialog onAddBook={addBook} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onLend={lendBook}
              onReturn={returnBook}
            />
          ))}
          {filteredBooks.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No books found. Add some books to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
