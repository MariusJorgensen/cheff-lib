
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserApprovalPanel } from "./UserApprovalPanel";
import { AdminBooksPanel } from "./AdminBooksPanel";
import { LibraryHeader } from "./LibraryHeader";
import { useAuth } from "./AuthProvider";

export function AdminPanel() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
        <LibraryHeader userEmail={user?.email} onSignOut={signOut} />
        
        <div className="p-3 sm:p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-purple-100 dark:border-gray-800 shadow-xl overflow-hidden">
          <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 sm:gap-4 bg-purple-100/50 dark:bg-gray-800/50 p-1 rounded-lg">
              <TabsTrigger 
                value="users"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md text-sm sm:text-base"
              >
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="books"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md text-sm sm:text-base"
              >
                Book Management
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-4">
              <div className="-mx-3 sm:mx-0">
                <UserApprovalPanel />
              </div>
            </TabsContent>
            <TabsContent value="books" className="mt-4">
              <div className="-mx-3 sm:mx-0">
                <AdminBooksPanel />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
