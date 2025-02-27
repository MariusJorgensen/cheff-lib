
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, Users, Book, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LibraryHeaderProps {
  userEmail: string | undefined;
  onSignOut: () => void;
}

export function LibraryHeader({ userEmail, onSignOut }: LibraryHeaderProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  useEffect(() => {
    // Only fetch pending users if the current user is an admin
    if (isAdmin) {
      const fetchPendingUsers = async () => {
        try {
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);
          
          if (error) {
            console.error('Error fetching pending users count:', error);
            return;
          }
          
          setPendingUsersCount(count || 0);
        } catch (error) {
          console.error('Unexpected error fetching pending users count:', error);
        }
      };

      fetchPendingUsers();

      // Subscribe to changes in the profiles table
      const subscription = supabase
        .channel('pending-users-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            fetchPendingUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isAdmin]);

  return (
    <div className="flex justify-between items-center">
      <button 
        onClick={() => navigate("/")}
        className="text-4xl font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <img 
          src="/lovable-uploads/a3896883-856c-4cab-85c0-fad540b10877.png" 
          alt="C Logo" 
          className="h-10 w-10 dark:invert transform -translate-y-0.5 translate-x-1"
        />
        <span className="bg-gradient-to-r from-[#E56962] to-[#3941E8] bg-clip-text text-transparent">
          heff.lib
        </span>
      </button>

      {/* Desktop view */}
      <div className="hidden md:flex items-center gap-4">
        <FeedbackDialog />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-[#F5F3E1] dark:hover:bg-[#0A1840]/20 relative"
            >
              <Users className="h-5 w-5" />
              {isAdmin && pendingUsersCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
                  variant="destructive"
                >
                  {pendingUsersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-muted-foreground">
              {userEmail}
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Users className="mr-2 h-4 w-4" />
                  Admin Panel
                  {pendingUsersCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {pendingUsersCount}
                    </Badge>
                  )}
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
              className="hover:bg-[#F5F3E1] dark:hover:bg-[#0A1840]/20 relative"
            >
              <Menu className="h-5 w-5" />
              {isAdmin && pendingUsersCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
                  variant="destructive"
                >
                  {pendingUsersCount}
                </Badge>
              )}
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
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Users className="mr-2 h-4 w-4" />
                  Admin Panel
                  {pendingUsersCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {pendingUsersCount}
                    </Badge>
                  )}
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
    </div>
  );
}
