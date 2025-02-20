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

  console.log("AuthProvider rendering", { 
    isLoading, 
    initializationComplete, 
    session, 
    user,
    currentPath: window.location.pathname 
  });

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        console.log("Starting initialization");
        const freshSession = await refreshSession();
        
        if (!isMounted) return;

        // Always update initialization state regardless of session
        setInitializationComplete(true);
        setIsLoading(false);

        if (!freshSession) {
          console.log("No session found during initialization");
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setIsAdmin(false);
          return;
        }

        console.log("Setting session and user from fresh session");
        setSession(freshSession);
        setUser(freshSession.user);

        if (freshSession.user) {
          console.log("Checking approval status for user:", freshSession.user.id);
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(freshSession.user.id);
          console.log("Approval status received:", { approved, isAdminUser });
          
          if (isMounted) {
            setIsApproved(approved);
            setIsAdmin(isAdminUser);
          }
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setIsAdmin(false);
          setInitializationComplete(true);
          setIsLoading(false);
          
          toast({
            title: "Error",
            description: "Failed to initialize session. Please try logging in again.",
            variant: "destructive",
          });
        }
      }
    };

    initialize();

    const authSubscription = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed", { event: _event, session: newSession });
      
      if (!isMounted) return;
      
      try {
        setInitializationComplete(true);
        setIsLoading(false);

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(newSession.user.id);
          
          if (isMounted) {
            setIsApproved(approved);
            setIsAdmin(isAdminUser);
          }
        } else {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsApproved(false);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        toast({
          title: "Error",
          description: "Failed to update session. Please try logging in again.",
          variant: "destructive",
        });
      }
    });

    const channel = supabase.channel('profile-changes');
    
    const profileSubscription = channel
      .on<Profile>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: user ? `id=eq.${user.id}` : undefined
        },
        async (payload: RealtimePostgresChangesPayload<Profile>) => {
          if (!isMounted || !user) return;
          
          if (payload.new && 'id' in payload.new && payload.new.id === user.id) {
            try {
              const freshSession = await refreshSession();
              if (freshSession?.user && isMounted) {
                const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(freshSession.user.id);
                setIsApproved(approved);
                setIsAdmin(isAdminUser);
              }
            } catch (error) {
              console.error("Error refreshing session after profile change:", error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      authSubscription.data.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && initializationComplete) {
      const currentPath = window.location.pathname;
      
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
      console.log("Signing out");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setSession(null);
      setUser(null);
      setIsApproved(false);
      setIsAdmin(false);
      
      // Clear any localStorage data
      localStorage.clear();
      
      // Force navigation to auth page
      console.log("Redirecting to auth page after signout");
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

export { useAuth } from './useAuth';
