
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Trash2 } from "lucide-react";

export function AdminBooksView() {
  const [books, setBooks] = useState<Book[]>([]);
  const { toast } = useToast();

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        loans (
          lent_to,
          created_at,
          returned_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    const processedBooks = data.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      imageUrl: book.image_url || '',
      bookType: book.book_type || 'non-fiction',
      location: book.location || 'Oslo 🇧🇻',
      lentTo: book.loans?.find((loan: any) => !loan.returned_at)?.lent_to || null,
      averageRating: book.average_rating || null,
      aiSummary: book.ai_summary || null,
      bookDescription: book.book_description || null,
      authorDescription: book.author_description || null,
      loans: book.loans || [],
    })) as Book[];

    setBooks(processedBooks);
  };

  const handleDeleteBook = async (bookId: number) => {
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

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="rounded-md border">
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
            <TableRow key={book.id}>
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
                  onClick={() => handleDeleteBook(book.id)}
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
  );
}
