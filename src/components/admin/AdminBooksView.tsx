
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Book } from "@/types";
import { Trash2, Map, Book as BookIcon } from "lucide-react";

export function AdminBooksView() {
  const [books, setBooks] = useState<Book[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        loans (
          id,
          lent_to,
          created_at,
          returned_at,
          user_id,
          profiles (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    const processedBooks = data.map(book => {
      const activeLoan = book.loans?.find((loan: any) => !loan.returned_at);
      const loanUserProfile = activeLoan?.profiles;
      const loanUserName = loanUserProfile 
        ? (loanUserProfile.full_name || loanUserProfile.email) 
        : activeLoan?.lent_to || null;

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        imageUrl: book.image_url || '',
        bookType: book.book_type || 'non-fiction',
        location: book.location || 'Oslo 🇧🇻',
        lentTo: loanUserName,
        averageRating: book.average_rating || null,
        aiSummary: book.ai_summary || null,
        bookDescription: book.book_description || null,
        authorDescription: book.author_description || null,
        loans: book.loans || [],
      } as Book;
    });

    setBooks(processedBooks);
  };

  const handleDeleteBook = async (bookId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click when clicking delete button
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Book has been removed from the library.",
    });

    fetchBooks();
  };

  const handleRowClick = (book: Book) => {
    navigate(`/?bookId=${book.id}`);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div>
      {/* Desktop view */}
      <div className="hidden sm:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow 
                key={book.id}
                onClick={() => handleRowClick(book)}
                className="cursor-pointer hover:bg-accent"
              >
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell className="capitalize">{book.bookType}</TableCell>
                <TableCell>{book.location}</TableCell>
                <TableCell>
                  {book.lentTo ? (
                    <div className="text-sm">
                      <span className="text-destructive">On Loan</span>
                      <div className="text-muted-foreground">To: {book.lentTo}</div>
                    </div>
                  ) : (
                    'Available'
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => handleDeleteBook(book.id, e)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden space-y-4">
        {books.map((book) => (
          <div 
            key={book.id} 
            className="bg-card rounded-lg border p-4 space-y-3 cursor-pointer hover:bg-accent/50"
            onClick={() => handleRowClick(book)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{book.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => handleDeleteBook(book.id, e)}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <BookIcon className="h-3 w-3" />
                {book.bookType}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
                <Map className="h-3 w-3" />
                {book.location}
              </span>
              <span className={`px-2 py-1 rounded-full ${book.lentTo ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                {book.lentTo ? `Loaned to ${book.lentTo}` : 'Available'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
