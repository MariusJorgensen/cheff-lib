
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/contexts/AuthContext";
import { useAuthState } from "@/hooks/useAuthState";
import { checkApprovalStatus } from "@/services/approvalService";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {
    session,
    setSession,
    user,
    setUser,
    isApproved,
    setIsApproved,
    isAdmin,
    setIsAdmin,
    isLoading,
    setIsLoading,
    initializationComplete,
    setInitializationComplete,
    refreshSession,
  } = useAuthState();

  useEffect(() => {
    console.log("Starting auth initialization...");
    let mounted = true;

    const initialize = async () => {
      console.log("Initializing auth state");
      
      if (!mounted) {
        console.log("Component unmounted, skipping initialization");
        return;
      }

      try {
        setIsLoading(true);
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(initialSession.user.id);
          if (mounted) {
            setIsApproved(approved);
            setIsAdmin(isAdminUser);
          }
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to initialize session",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitializationComplete(true);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      if (!mounted) return;

      try {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(newSession.user.id);
          setIsApproved(approved);
          setIsAdmin(isAdminUser);
        } else {
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        toast({
          title: "Error",
          description: "Failed to update session",
          variant: "destructive",
        });
      }
    });

    initialize();

    return () => {
      console.log("Cleaning up auth provider");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log("Auth provider state:", { initializationComplete, session, user });

  // Don't show loading spinner on auth route
  if (!initializationComplete && location.pathname !== '/auth') {
    console.log("Showing loading spinner...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, isApproved, isAdmin, signOut: async () => {
      try {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsApproved(false);
        setIsAdmin(false);
        navigate("/auth", { replace: true });
      } catch (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
      }
    } }}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';
