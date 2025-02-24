
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-1">
            <img 
              src="/lovable-uploads/a3896883-856c-4cab-85c0-fad540b10877.png" 
              alt="C Logo" 
              className="h-10 w-10 dark:invert transform -translate-y-0.5 translate-x-0.5"
            />
            <span className="bg-gradient-to-r from-[#E56962] to-[#3941E8] bg-clip-text text-transparent">
              heff.lib
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue
          </p>
          <div className="mt-8">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
