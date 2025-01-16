import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();
  const isProduction = window.location.hostname !== 'localhost';
  const redirectUrl = isProduction 
    ? 'https://app.qrmanager.co'
    : window.location.origin;

  useEffect(() => {
    console.log('Auth component mounted, checking session...');
    
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session);
      if (session) {
        console.log('User already logged in, navigating to home');
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === "SIGNED_IN" && session) {
        console.log('User signed in, navigating to home');
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to QR Manager</CardTitle>
        </CardHeader>
        <CardContent>
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