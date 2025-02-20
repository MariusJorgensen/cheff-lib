
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
    const initialize = async () => {
      try {
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          const { approved, isAdmin: isAdminUser } = await checkApprovalStatus(initialSession.user.id);
          setIsApproved(approved);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        toast({
          title: "Error",
          description: "Failed to initialize session",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setInitializationComplete(true);
      }
    };

    initialize();

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", { event, newSession });
      
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
      setIsLoading(false);
      setInitializationComplete(true);
    });

    // Set up profile changes subscription
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
          if (!user) return;
          
          if (payload.new && 'id' in payload.new && payload.new.id === user.id) {
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
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle navigation based on auth state
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
