
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface LibraryHeaderProps {
  userEmail: string | undefined;
  onSignOut: () => void;
}

export function LibraryHeader({ userEmail, onSignOut }: LibraryHeaderProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-4xl font-bold flex items-center gap-1">
        <img 
          src="/lovable-uploads/a3896883-856c-4cab-85c0-fad540b10877.png" 
          alt="C Logo" 
          className="h-10 w-10 dark:invert transform -translate-y-0.5 translate-x-1"
        />
        <span className="bg-gradient-to-r from-[#E56962] to-[#3941E8] bg-clip-text text-transparent">
          heff.lib
        </span>
      </h1>

      {/* Desktop view */}
      <div className="hidden md:flex items-center gap-4">
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
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  Admin Dashboard
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-[#F5F3E1] dark:hover:bg-[#0A1840]/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <FeedbackDialog />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ThemeToggle />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              {userEmail}
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
