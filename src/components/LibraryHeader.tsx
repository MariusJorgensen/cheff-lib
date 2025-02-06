
import { ThemeToggle } from "@/components/ThemeToggle";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LibraryHeaderProps {
  userEmail: string | undefined;
  onSignOut: () => void;
}

export function LibraryHeader({ userEmail, onSignOut }: LibraryHeaderProps) {
  return (
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
              {userEmail}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
