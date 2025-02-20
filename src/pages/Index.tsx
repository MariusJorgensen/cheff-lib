
import { useState } from "react";
import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";
import { useAuth } from "@/components/AuthProvider";
import { useBooks } from "@/hooks/useBooks";
import { LibraryHeader } from "@/components/LibraryHeader";
import { LibraryControls } from "@/components/LibraryControls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserApprovalPanel } from "@/components/UserApprovalPanel";

const Index = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { user, signOut, isApproved, isAdmin } = useAuth();
  const { books, addBook, lendBook, returnBook } = useBooks(user);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                         book.author.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "available" && !book.lentTo) ||
      (filter === "borrowed" && book.lentTo) ||
      (filter === "my-loans" && book.lentTo?.toLowerCase() === user?.email?.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  const handleAddBook = (title: string, author: string, imageUrl: string, location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻') => {
    addBook(title, author, imageUrl, location);
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
        
        {isAdmin && <UserApprovalPanel />}

        <LibraryControls
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onAddBook={handleAddBook}
        />

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
              {filter === "my-loans" 
                ? "You haven't borrowed any books yet."
                : "No books found. Add some books to get started!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
