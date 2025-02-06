import { useState } from "react";
import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search } from "lucide-react";

const Index = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const addBook = (title: string, author: string) => {
    const newBook: Book = {
      id: Date.now(),
      title,
      author,
      lentTo: null,
    };
    setBooks([...books, newBook]);
    toast({
      title: "Book Added",
      description: `${title} has been added to the library.`,
    });
  };

  const lendBook = (id: number) => {
    const borrower = prompt("Enter borrower's name:");
    if (borrower) {
      setBooks(
        books.map((book) =>
          book.id === id ? { ...book, lentTo: borrower } : book
        )
      );
      toast({
        title: "Book Lent",
        description: `Book has been lent to ${borrower}.`,
      });
    }
  };

  const returnBook = (id: number) => {
    setBooks(books.map((book) => (book.id === id ? { ...book, lentTo: null } : book)));
    toast({
      title: "Book Returned",
      description: "Book has been returned to the library.",
    });
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
          <ThemeToggle />
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