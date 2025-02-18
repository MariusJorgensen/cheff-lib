
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddBookDialog } from "@/components/AddBookDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LibraryControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  onAddBook: (title: string, author: string, imageUrl: string) => void;
}

export function LibraryControls({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onAddBook,
}: LibraryControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter books" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Books</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="borrowed">On Loan</SelectItem>
          <SelectItem value="my-loans">My Borrowed Books</SelectItem>
        </SelectContent>
      </Select>
      <AddBookDialog onAddBook={onAddBook} />
    </div>
  );
}
