
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/contexts/AuthContext";
import { useAuthState } from "@/hooks/useAuthState";
import { checkApprovalStatus } from "@/services/approvalService";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Profile = {
  id: string;
  is_approved: boolean;
  [key: string]: any;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
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

  // Initialize auth state
  useEffect(() => {
    console.log("Starting auth initialization...");
    let mounted = true;

    const handleSession = async (currentSession: any) => {
      console.log("Handling session:", currentSession);
      
      if (!mounted) {
        console.log("Component unmounted, skipping session handling");
        return;
      }

      try {
        if (currentSession?.user) {
          console.log("Setting session and user");
          setSession(currentSession);
          setUser(currentSession.user);
          
          console.log("Checking approval status");
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(currentSession.user.id);
          
          if (!mounted) {
            console.log("Component unmounted during approval check");
            return;
          }
          
          console.log("Setting approval status:", { approved, isAdmin: isAdminUser });
          setIsApproved(approved);
          setIsAdmin(isAdminUser);

          if (window.location.pathname === '/auth') {
            console.log("Redirecting to home from auth page");
            navigate('/', { replace: true });
          }
        } else {
          console.log("No session found, clearing state");
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setIsAdmin(false);

          if (window.location.pathname !== '/auth') {
            console.log("Redirecting to auth page");
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error in handleSession:", error);
        if (!mounted) return;
        
        toast({
          title: "Error",
          description: "Failed to initialize session",
          variant: "destructive",
        });
      }

      if (mounted && !initializationComplete) {
        console.log("Marking initialization as complete");
        setInitializationComplete(true);
      }
    };

    const initialize = async () => {
      console.log("Initializing auth state");
      
      if (!mounted) {
        console.log("Component unmounted, skipping initialization");
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        console.log("Initial session received:", initialSession);
        await handleSession(initialSession);
      } catch (error) {
        console.error("Error during initialization:", error);
        if (!mounted) return;
        
        toast({
          title: "Error",
          description: "Failed to initialize session",
          variant: "destructive",
        });
        setInitializationComplete(true);
      }
    };

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      if (mounted) {
        handleSession(newSession);
      }
    });

    // Initialize auth state
    initialize();

    return () => {
      console.log("Cleaning up auth provider");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
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
  };

  console.log("Auth provider state:", { initializationComplete, session, user });

  // Only show loading state during initial initialization
  if (!initializationComplete) {
    console.log("Showing loading spinner...");
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

export { useAuth } from './useAuth';
