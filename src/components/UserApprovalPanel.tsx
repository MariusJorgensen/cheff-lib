
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export function UserApprovalPanel() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('is_approved', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending users:', error);
      return;
    }

    setPendingUsers(data || []);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

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

    fetchPendingUsers();
  };

  if (pendingUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>Review and approve new user requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{user.email}</p>
                {user.full_name && (
                  <p className="text-sm text-muted-foreground">{user.full_name}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={() => handleApproveUser(user.id)}>
                Approve
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
