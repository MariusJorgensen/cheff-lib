
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
import { Book } from "@/types";

interface BookWithLoanInfo extends Book {
  currentBorrower?: string;
  loanDate?: string;
}

export function AdminBooksView() {
  const [books, setBooks] = useState<BookWithLoanInfo[]>([]);

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

    const processedBooks = data.map(book => {
      const activeLoan = book.loans?.find((loan: any) => !loan.returned_at);
      return {
        ...book,
        currentBorrower: activeLoan?.lent_to || null,
        loanDate: activeLoan?.created_at || null,
      };
    });

    setBooks(processedBooks);
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
            <TableHead>Current Borrower</TableHead>
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
                {book.currentBorrower ? 'On Loan' : 'Available'}
              </TableCell>
              <TableCell>
                {book.currentBorrower ? (
                  <div className="text-sm">
                    <div>{book.currentBorrower}</div>
                    <div className="text-muted-foreground">
                      Since: {new Date(book.loanDate!).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
