import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;

  const createTrialSubscription = async (userId: string) => {
    try {
      console.log('Checking for ANY existing subscriptions for user:', userId);
      
      // Check for ANY subscription, not just active ones
      const { data: existingSubscriptions, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error checking existing subscriptions:', fetchError);
        throw fetchError;
      }

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        console.log('User already has subscriptions:', existingSubscriptions);
        return;
      }

      console.log('Creating new trial subscription for user:', userId);
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: userId,
            status: 'trialing',
            trial_ends_at: trialEndDate.toISOString(),
          }
        ]);

      if (subscriptionError) {
        console.error('Error creating trial subscription:', subscriptionError);
        throw subscriptionError;
      }

      console.log('Trial subscription created successfully');
      toast({
        title: "Trial Started",
        description: "Your 7-day free trial has begun!",
      });
    } catch (err) {
      console.error('Error in createTrialSubscription:', err);
      toast({
        title: "Error",
        description: "Failed to start your trial. Please contact support.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('Auth component mounted, checking session...');
    console.log('Current hostname:', window.location.hostname);
    console.log('Redirect URL:', redirectUrl);
    console.log('Current pathname:', window.location.pathname);
    
    let mounted = true;
    
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Detected OAuth callback, setting session...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (session && mounted) {
            console.log('OAuth callback successful, creating trial subscription...');
            await createTrialSubscription(session.user.id);
            console.log('Session set successfully, navigating to home');
            navigate("/", { replace: true });
          }
        } catch (err) {
          console.error('Error handling OAuth callback:', err);
          setError('Failed to complete authentication. Please try again.');
        }
      }
    };

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === "SIGNED_IN" && session && mounted) {
        console.log('User signed in, creating trial subscription...');
        await createTrialSubscription(session.user.id);
        console.log('Trial subscription created, navigating to home');
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
          <div className="mb-4 text-center text-sm text-gray-600">
            Start with a 7-day free trial. No credit card required.
          </div>
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