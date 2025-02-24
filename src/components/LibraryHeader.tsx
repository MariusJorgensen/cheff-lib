
import { ThemeToggle } from "@/components/ThemeToggle";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "@/components/FeedbackDialog";
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
      <h1 className="text-4xl font-bold flex items-center gap-1">
        <img 
          src="/lovable-uploads/a3896883-856c-4cab-85c0-fad540b10877.png" 
          alt="C Logo" 
          className="h-10 w-10 dark:invert transform -translate-y-0.5 translate-x-0.5"
        />
        <span className="bg-gradient-to-r from-[#E56962] to-[#3941E8] bg-clip-text text-transparent">
          heff.lib
        </span>
      </h1>
      <div className="flex items-center gap-4">
        <FeedbackDialog />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-[#F5F3E1] dark:hover:bg-[#0A1840]/20"
            >
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
