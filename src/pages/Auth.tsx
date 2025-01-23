import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // Update redirect URL based on environment
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    console.log('Auth component mounted, checking session...');
    console.log('Current hostname:', window.location.hostname);
    console.log('Redirect URL:', redirectUrl);
    console.log('Current pathname:', window.location.pathname);
    
    let mounted = true;
    
    // Handle the OAuth callback
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Detected OAuth callback, setting session...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (session && mounted) {
            console.log('Session set successfully, navigating to home');
            navigate("/", { replace: true });
          }
        } catch (err) {
          console.error('Error handling OAuth callback:', err);
          setError('Failed to complete authentication. Please try again.');
        }
      }
    };

    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log('Current session:', session);
        if (session && mounted) {
          console.log('User already logged in, navigating to home');
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Failed to check authentication status.');
      }
    };

    handleOAuthCallback();
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === "SIGNED_IN" && session && mounted) {
        console.log('User signed in, navigating to home');
        navigate("/", { replace: true });
      }
      if (event === "SIGNED_OUT") {
        console.log('User signed out');
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectUrl]);

  return (
    <div className="container min-h-screen flex items-center justify-center bg-gray-50 px-6 md:px-0">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to QR Manager</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <SupabaseAuth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#000000',
                    brandAccent: '#666666',
                  },
                },
              },
            }}
            providers={["google"]}
            redirectTo={redirectUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;