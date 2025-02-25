
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
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_approved: boolean;
  is_admin: boolean;
}

export function UserApprovalPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, is_approved');

      if (profilesError) throw profilesError;

      // Then get admin status for each profile
      const usersWithAdminStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: isAdmin } = await supabase
            .rpc('is_admin', { user_id: profile.id });
          return { ...profile, is_admin: isAdmin || false };
        })
      );

      setUsers(usersWithAdminStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel('any-db-changes')
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
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users'
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

      if (error) throw error;

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

  const handleUpdateAdminRole = async (userId: string, makeAdmin: boolean) => {
    setUpdating(userId);
    try {
      if (makeAdmin) {
        const { error } = await supabase
          .from('admin_users')
          .insert({ id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', userId);
        if (error) throw error;
      }

      if (userId === user?.id) {
        toast({
          title: "Admin Status Updated",
          description: "Your admin status has been updated. Please sign in again.",
        });
        await signOut();
      } else {
        toast({
          title: "Success",
          description: `User has been ${makeAdmin ? 'made admin' : 'removed from admin role'}.`,
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="min-w-[200px]">
                    <div className="space-y-1">
                      {user.full_name && (
                        <div className="font-medium">{user.full_name}</div>
                      )}
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex gap-2 md:hidden">
                        {user.is_admin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span className={user.is_approved ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                        {user.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <div className="hidden md:block">
                        {user.is_admin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col gap-2 items-end">
                      {user.is_approved ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateApproval(user.id, false)}
                          disabled={updating === user.id}
                          className="w-full sm:w-auto"
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateApproval(user.id, true)}
                          disabled={updating === user.id}
                          className="w-full sm:w-auto"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant={user.is_admin ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => handleUpdateAdminRole(user.id, !user.is_admin)}
                        disabled={updating === user.id}
                        className="w-full sm:w-auto"
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
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
