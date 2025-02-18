
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

  console.log("AuthProvider rendering, isLoading:", isLoading);

  const checkApprovalStatus = async (userId: string) => {
    console.log("Starting checkApprovalStatus");
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching approval status:', profileError);
        return false;
      }

      const { data: adminStatus, error: adminError } = await supabase
        .rpc('is_admin', { user_id: userId });

      if (adminError) {
        console.error('Error checking admin status:', adminError);
      }

      const approved = !!profile?.is_approved;
      const isAdminUser = !!adminStatus;
      
      setIsAdmin(isAdminUser);
      setIsApproved(approved);
      console.log("Finished checkApprovalStatus, approved:", approved, "isAdmin:", isAdminUser);

      return approved;
    } catch (error) {
      console.error('Error in checkApprovalStatus:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log("Initial useEffect running");
    let isMounted = true;
    let timeoutId: number;

    const initialize = async () => {
      try {
        console.log("Starting initialization");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) setIsLoading(false);
          return;
        }

        console.log("Got initial session:", initialSession);
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await checkApprovalStatus(initialSession.user.id);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = window.setTimeout(() => {
      console.log("Loading timeout triggered");
      if (isMounted && isLoading) {
        console.error("Loading timed out after 5 seconds");
        setIsLoading(false);
      }
    }, 5000);

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed:", _event, newSession);
      
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await checkApprovalStatus(newSession.user.id);
        }
      }
    });

    return () => {
      console.log("Cleanup running");
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("Navigation useEffect running", { isLoading, session, pathname: window.location.pathname });
    if (!isLoading) {
      const currentPath = window.location.pathname;
      if (!session && currentPath !== "/auth") {
        console.log("Navigating to /auth");
        navigate("/auth");
      } else if (session && currentPath === "/auth") {
        console.log("Navigating to /");
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
    console.log("Rendering loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  console.log("Rendering AuthProvider children");
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
