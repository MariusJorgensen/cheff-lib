
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, UserCog, Check, X, Shield, ShieldOff, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserDetailsDialog } from "./UserDetailsDialog";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, is_approved');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      const usersWithAdminStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', profile.id)
            .maybeSingle();
          return { ...profile, is_admin: !!adminData };
        })
      );

      console.log("Users fetched:", usersWithAdminStatus);
      setUsers(usersWithAdminStatus);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again later.",
        variant: "destructive",
      });
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
          console.log("Profiles table changed, refreshing users...");
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
          console.log("Admin users table changed, refreshing users...");
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
      console.error('Error updating approval status:', error);
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
      console.error('Error updating admin role:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setUpdating(userToDelete.id);
    try {
      // Delete the user from auth schema via RPC call
      const { error: deleteError } = await supabase.rpc('delete_user', {
        user_id: userToDelete.id
      });

      if (deleteError) {
        // Try the alternative delete approach - delete from profiles table
        // This will cascade to auth.users if configured properly
        const { error: profilesDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id);

        if (profilesDeleteError) throw profilesDeleteError;
      }

      toast({
        title: "Success",
        description: `User ${userToDelete.email} has been deleted.`,
      });

      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm));

    switch (filter) {
      case "verified":
        return matchesSearch && u.is_approved;
      case "pending":
        return matchesSearch && !u.is_approved;
      default:
        return matchesSearch;
    }
  });

  const pendingCount = users.filter(u => !u.is_approved).length;
  const verifiedCount = users.filter(u => u.is_approved).length;

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        No users found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(value: "all" | "verified" | "pending") => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Users ({users.length})
            </SelectItem>
            <SelectItem value="verified">
              Verified Users ({verifiedCount})
            </SelectItem>
            <SelectItem value="pending">
              Pending Verification ({pendingCount})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card 
            key={user.id} 
            className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="absolute top-0 right-0 p-3">
                {user.is_admin ? (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                ) : user.is_approved ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <UserCog className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div 
                  className="space-y-2 cursor-pointer"
                  onClick={() => setSelectedUser({ id: user.id, name: user.full_name })}
                >
                  {user.full_name && (
                    <h3 className="font-medium text-lg">{user.full_name}</h3>
                  )}
                  <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  {user.is_approved ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUpdateApproval(user.id, false)}
                      disabled={updating === user.id}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Revoke Access
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpdateApproval(user.id, true)}
                        disabled={updating === user.id}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        disabled={updating === user.id}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                  <Button
                    variant={user.is_admin ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => handleUpdateAdminRole(user.id, !user.is_admin)}
                    disabled={updating === user.id}
                    className="w-full"
                  >
                    {user.is_admin ? (
                      <>
                        <ShieldOff className="w-4 h-4 mr-1" />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-1" />
                        Make Admin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <UserDetailsDialog
        userId={selectedUser?.id || null}
        userName={selectedUser?.name || null}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
