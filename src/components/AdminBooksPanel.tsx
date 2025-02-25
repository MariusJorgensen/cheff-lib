
import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/components/AuthProvider";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminBooksPanel() {
  const { user } = useAuth();
  const { books, refreshBooks } = useBooks(user);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDeleteBook = async (book: Book) => {
    try {
      setIsDeleting(book.id);
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book has been deleted.",
      });
      
      refreshBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden md:table-cell">Added By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">
                  {book.title}
                  <div className="text-sm text-muted-foreground md:hidden">
                    {book.author}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{book.author}</TableCell>
                <TableCell className="hidden md:table-cell">{book.addedBy || 'Unknown'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBook(book)}
                    disabled={isDeleting === book.id}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
