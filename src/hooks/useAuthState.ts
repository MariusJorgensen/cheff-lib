
import { useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationComplete, setInitializationComplete] = useState(false);

  const refreshSession = async () => {
    try {
      console.log("Refreshing session...");
      const { data: { session: freshSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        throw error;
      }
      
      console.log("Session refresh complete:", freshSession);
      return freshSession;
    } catch (error) {
      console.error("Exception in refreshSession:", error);
      // Instead of returning null, throw the error so it can be handled by the caller
      throw error;
    }
  };

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
