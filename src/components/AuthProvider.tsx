
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

  console.log("AuthProvider rendering", { isLoading, initializationComplete, session });

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
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(freshSession.user.id);
          setIsApproved(approved);
          setIsAdmin(isAdminUser);
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
        const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(newSession.user.id);
        setIsApproved(approved);
        setIsAdmin(isAdminUser);
      }
    });

    // Listen for profile changes using the correct type
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
          console.log('Profile changed:', payload);
          if (user && payload.new && 'id' in payload.new && payload.new.id === user.id) {
            const freshSession = await refreshSession();
            if (freshSession?.user) {
              const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(freshSession.user.id);
              setIsApproved(approved);
              setIsAdmin(isAdminUser);
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

export { useAuth } from './useAuth';
