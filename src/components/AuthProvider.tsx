
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkApprovalStatus = async (userId: string) => {
    try {
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
    } catch (error) {
      console.error('Error in checkApprovalStatus:', error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        console.log("Initial session:", initialSession);
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await checkApprovalStatus(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed:", _event, newSession);
      
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          const approved = await checkApprovalStatus(newSession.user.id);
          console.log("Approval check result:", approved);
          if (!approved) {
            toast({
              title: "Account Pending Approval",
              description: "Your account is pending admin approval. Please check back later.",
            });
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      if (!session && currentPath !== "/auth") {
        navigate("/auth");
      } else if (session && currentPath === "/auth") {
        navigate("/");
      }
    }
  }, [session, isLoading, navigate]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsApproved(false);
      setIsAdmin(false);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

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
