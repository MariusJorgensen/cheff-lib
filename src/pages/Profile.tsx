
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Profile() {
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
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>
      <UserProfile />
    </div>
  );
}
