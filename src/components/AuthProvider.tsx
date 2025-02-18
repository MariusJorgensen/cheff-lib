
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isApproved: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkApprovalStatus = async (userId: string) => {
    console.log("Checking approval status for user:", userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching approval status:', profileError);
      return false;
    }

    console.log("Profile data:", profile);

    const { data: adminStatus, error: adminError } = await supabase
      .rpc('is_admin', { user_id: userId });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
    }

    console.log("Admin status:", adminStatus);

    const approved = !!profile?.is_approved;
    const isAdminUser = !!adminStatus;

    console.log("Setting states - isApproved:", approved, "isAdmin:", isAdminUser);
    
    setIsAdmin(isAdminUser);
    setIsApproved(approved);

    return approved;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        checkApprovalStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        const approved = await checkApprovalStatus(session.user.id);
        console.log("Approval check result:", approved);
        if (!approved) {
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending admin approval. Please check back later.",
          });
        }
        navigate("/");
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ session, user, isApproved, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
