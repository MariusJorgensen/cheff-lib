
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersView } from "@/components/admin/AdminUsersView";
import { AdminBooksView } from "@/components/admin/AdminBooksView";
import { LibraryHeader } from "@/components/LibraryHeader";

export default function Admin() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <LibraryHeader 
          userEmail={user?.email}
          onSignOut={signOut}
        />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-2xl font-semibold">User Management</h2>
            <AdminUsersView />
          </TabsContent>
          
          <TabsContent value="books" className="space-y-4">
            <h2 className="text-2xl font-semibold">Book Management</h2>
            <AdminBooksView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
