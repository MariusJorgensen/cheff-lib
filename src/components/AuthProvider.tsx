
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
      if (!mounted) return;

      try {
        if (currentSession?.user) {
          console.log("Setting session and user");
          setSession(currentSession);
          setUser(currentSession.user);
          
          console.log("Checking approval status");
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(currentSession.user.id);
          if (!mounted) return;
          
          console.log("Setting approval status:", { approved, isAdmin: isAdminUser });
          setIsApproved(approved);
          setIsAdmin(isAdminUser);

          if (window.location.pathname === '/auth') {
            console.log("Redirecting to home");
            navigate('/', { replace: true });
          }
        } else {
          console.log("No session, clearing state");
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setIsAdmin(false);

          if (window.location.pathname !== '/auth') {
            console.log("Redirecting to auth");
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error in handleSession:", error);
      } finally {
        if (mounted) {
          console.log("Setting initialization complete");
          setInitializationComplete(true);
        }
      }
    };

    const initialize = async () => {
      if (!mounted) return;

      try {
        console.log("Getting initial session...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session received:", initialSession);
        
        await handleSession(initialSession);
      } catch (error) {
        console.error("Error during initialization:", error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to initialize session",
            variant: "destructive",
          });
          setInitializationComplete(true);
        }
      }
    };

    // Set up auth subscription first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      if (mounted) {
        await handleSession(newSession);
      }
    });

    // Then initialize
    initialize();

    // Clean up function
    return () => {
      console.log("Cleaning up auth provider...");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setSession, setUser, setIsApproved, setIsAdmin, setInitializationComplete]);

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
