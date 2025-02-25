
import { useState } from "react";
import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";
import { useAuth } from "@/components/AuthProvider";
import { useBooks } from "@/hooks/useBooks";
import { LibraryHeader } from "@/components/LibraryHeader";
import { LibraryControls } from "@/components/LibraryControls";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { user, signOut, isApproved, isAdmin } = useAuth();
  const { books, addBook, lendBook, returnBook } = useBooks(user);

  const filteredBooks = books.filter((book) => {
    const searchTerms = search.toLowerCase();
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerms) ||
      book.author.toLowerCase().includes(searchTerms) ||
      book.location.toLowerCase().includes(searchTerms) ||
      book.bookType.toLowerCase().includes(searchTerms);
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "available" && !book.lentTo) ||
      (filter === "borrowed" && book.lentTo) ||
      (filter === "my-loans" && book.loans?.some(loan => 
        !loan.returned_at && loan.user_id === user?.id
      ));

    return matchesSearch && matchesFilter;
  });

  const handleAddBook = (
    title: string, 
    author: string, 
    imageUrl: string, 
    location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻',
    bookDescription?: string,
    authorDescription?: string
  ) => {
    addBook(title, author, imageUrl, location, bookDescription, authorDescription);
  };

  if (!isApproved && !isAdmin) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <LibraryHeader userEmail={user?.email} onSignOut={signOut} />
          <Alert>
            <AlertDescription>
              Your account is pending admin approval. Please check back later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <LibraryHeader 
          userEmail={user?.email}
          onSignOut={signOut}
        />

        <LibraryControls
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onAddBook={handleAddBook}
        />

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
              {filter === "my-loans" 
                ? "You haven't borrowed any books yet."
                : "No books found. Add some books to get started!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Index;
