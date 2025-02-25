
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "./AuthProvider";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_approved: boolean;
}

export function UserApprovalPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, is_approved')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateApproval = async (userId: string, approve: boolean) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approve })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      if (userId === user?.id) {
        toast({
          title: "Status Updated",
          description: "Your account status has been updated. Please sign in again.",
        });
        await signOut();
      } else {
        toast({
          title: "Success",
          description: `User has been ${approve ? 'approved' : 'revoked'}.`,
        });
      }

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="min-w-[200px]">
                    {user.full_name && (
                      <div className="font-medium">{user.full_name}</div>
                    )}
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      {new Date(user.created_at).toLocaleDateString()}
                      <br />
                      Status: {user.is_approved ? 'Approved' : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={user.is_approved ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {user.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {user.is_approved ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateApproval(user.id, false)}
                        disabled={updating === user.id}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpdateApproval(user.id, true)}
                        disabled={updating === user.id}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
