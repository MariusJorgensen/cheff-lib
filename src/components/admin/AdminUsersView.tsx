
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Ban, Check } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  is_admin?: boolean;
}

export function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    // Fetch admin users to check admin status
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('id');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      return;
    }

    const adminIds = new Set(adminUsers?.map(admin => admin.id));
    
    const usersWithAdminStatus = profiles.map(profile => ({
      ...profile,
      is_admin: adminIds.has(profile.id)
    }));

    setUsers(usersWithAdminStatus);
  };

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User has been approved.",
    });

    fetchUsers();
  };

  const handleRevokeUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to revoke user access. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User access has been revoked.",
    });

    fetchUsers();
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    let error;
    
    if (isCurrentlyAdmin) {
      // Remove from admin_users
      const { error: removeError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);
      error = removeError;
    } else {
      // Add to admin_users
      const { error: addError } = await supabase
        .from('admin_users')
        .insert([{ id: userId }]);
      error = addError;
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update admin status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `User is ${isCurrentlyAdmin ? 'no longer' : 'now'} an admin.`,
    });

    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || 'N/A'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.is_approved ? 'Approved' : 'Pending'}</TableCell>
              <TableCell>{user.is_admin ? 'Admin' : 'User'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {!user.is_approved ? (
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApproveUser(user.id)}
                      className="text-green-600 hover:text-green-600"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeUser(user.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                    className={user.is_admin ? "text-orange-500 hover:text-orange-500" : "text-muted-foreground"}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
