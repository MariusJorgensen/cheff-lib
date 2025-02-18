
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
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

// Define the payload type for profile changes
interface ProfileChanges extends RealtimePostgresChangesPayload<{
  id: string;
  is_approved: boolean;
  [key: string]: any;
}> {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("AuthProvider rendering", { isLoading, initializationComplete, session });

  const refreshSession = async () => {
    const { data: { session: freshSession }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    return freshSession;
  };

  const checkApprovalStatus = async (userId: string) => {
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
        console.log("Starting initialization");
        const freshSession = await refreshSession();
        
        if (!isMounted) return;

        setSession(freshSession);
        setUser(freshSession?.user ?? null);
        
        if (freshSession?.user) {
          await checkApprovalStatus(freshSession.user.id);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setInitializationComplete(true);
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth state changes
    const authSubscription = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed", { event: _event, newSession });
      
      if (!isMounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        await checkApprovalStatus(newSession.user.id);
      }
    });

    // Listen for profile changes
    const profileSubscription = supabase.channel('public:profiles')
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: user ? `id=eq.${user.id}` : undefined
        },
        async (payload: ProfileChanges) => {
          console.log('Profile changed:', payload);
          if (user && payload.new && payload.new.id === user.id) {
            // Force session refresh when profile changes
            const freshSession = await refreshSession();
            if (freshSession?.user) {
              await checkApprovalStatus(freshSession.user.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      authSubscription.data.subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isLoading && initializationComplete) {
      const currentPath = window.location.pathname;
      console.log("Navigation check", { currentPath, session });
      
      if (!session && currentPath !== "/auth") {
        navigate("/auth", { replace: true });
      } else if (session && currentPath === "/auth") {
        navigate("/", { replace: true });
      }
    }
  }, [session, isLoading, initializationComplete, navigate]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setSession(null);
      setUser(null);
      setIsApproved(false);
      setIsAdmin(false);
      
      // Force navigation to auth page
      await navigate("/auth", { replace: true });
      
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !initializationComplete) {
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
