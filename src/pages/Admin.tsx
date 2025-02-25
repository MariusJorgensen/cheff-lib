
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { AdminLayout } from "@/components/AdminLayout";

export default function Admin() {
  const { isAdmin, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
      return;
    }
    
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, session, navigate]);

  if (!isAdmin || !session) {
    return null;
  }

  return <AdminLayout />;
}
