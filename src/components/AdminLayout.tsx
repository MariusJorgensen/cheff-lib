
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserApprovalPanel } from "./UserApprovalPanel";
import { AdminBooksPanel } from "./AdminBooksPanel";

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="users" className="flex-1 md:flex-none">Users</TabsTrigger>
          <TabsTrigger value="books" className="flex-1 md:flex-none">Books</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UserApprovalPanel />
        </TabsContent>
        <TabsContent value="books" className="mt-4">
          <AdminBooksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
