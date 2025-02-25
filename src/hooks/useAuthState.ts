
import { useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...");
      const { data: { session: freshSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return null;
      }
      console.log("Session refresh complete:", freshSession);
      return freshSession;
    } catch (error) {
      console.error("Exception in refreshSession:", error);
      return null;
    }
  }, []);

  return {
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
  };
}
