
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BookOpen, Library, CalendarClock } from "lucide-react";

interface UserDetailsProps {
  userId: string | null;
  userName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserActivity {
  addedBooks: Book[];
  loanHistory: {
    book: Book;
    lentTo: string;
    loanDate: string;
    returnedAt: string | null;
  }[];
}

interface SupabaseBook {
  id: number;
  title: string;
  author: string;
  created_at: string;
  image_url: string;
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻';
  book_type: 'fiction' | 'non-fiction' | 'cookbook';
}

const mapSupabaseBookToBook = (book: SupabaseBook): Book => ({
  id: book.id,
  title: book.title,
  author: book.author,
  imageUrl: book.image_url,
  location: book.location,
  bookType: book.book_type,
  createdAt: book.created_at,
  lentTo: null,
  averageRating: null,
  aiSummary: null,
  reactions: {},
  userReactions: [],
  loans: [],
  bookDescription: null,
  authorDescription: null
});

export function UserDetailsDialog({ userId, userName, isOpen, onClose }: UserDetailsProps) {
  const [userActivity, setUserActivity] = useState<UserActivity>({
    addedBooks: [],
    loanHistory: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserActivity();
    }
  }, [userId, isOpen]);

  const fetchUserActivity = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      // Fetch books added by the user
      const { data: addedBooksData } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          created_at,
          image_url,
          location,
          book_type
        `)
        .eq('added_by_user_id', userId);

      // Fetch loan history
      const { data: loans } = await supabase
        .from('loans')
        .select(`
          created_at,
          returned_at,
          lent_to,
          books (
            id,
            title,
            author,
            image_url,
            location,
            book_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const loanHistory = loans?.map((loan) => ({
        book: mapSupabaseBookToBook(loan.books as SupabaseBook),
        lentTo: loan.lent_to || '',
        loanDate: loan.created_at,
        returnedAt: loan.returned_at,
      })) || [];

      setUserActivity({
        addedBooks: (addedBooksData || []).map(mapSupabaseBookToBook),
        loanHistory,
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Activity for {userName || 'User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Books Added Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Library className="w-5 h-5" />
              Books Added to Library
            </h3>
            {userActivity.addedBooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivity.addedBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.location}</TableCell>
                      <TableCell>
                        {format(new Date(book.createdAt || ''), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No books added yet.</p>
            )}
          </div>

          {/* Loan History Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5" />
              Loan History
            </h3>
            {userActivity.loanHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Returned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivity.loanHistory.map((loan, index) => (
                    <TableRow key={`${loan.book.id}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{loan.book.title}</div>
                          <div className="text-sm text-muted-foreground">
                            by {loan.book.author}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!loan.returnedAt ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <CalendarClock className="w-3 h-3 mr-1" />
                            Currently Borrowed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Returned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(loan.loanDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {loan.returnedAt 
                          ? format(new Date(loan.returnedAt), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No borrowing history.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
