import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    createLemonSqueezy: () => {
      Setup: ({ eventHandler }: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

const Upgrade = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch subscription status
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setSubscription(sub);

      // Fetch available plans
      const { data: availablePlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_usd', { ascending: true });

      setPlans(availablePlans || []);
      setLoading(false);

      // Initialize Lemon Squeezy
      const script = document.createElement('script');
      script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const lemonSqueezy = window.createLemonSqueezy();
        lemonSqueezy.Setup({
          eventHandler: async (event) => {
            if (event.event === 'checkout:opened') {
              console.log('Checkout opened');
            }
            if (event.event === 'checkout:closed') {
              console.log('Checkout closed');
            }
          },
        });
      };

      return () => {
        document.body.removeChild(script);
      };
    };

    checkSession();
  }, [navigate]);

  const handleUpgrade = async (planId: string, lemonSqueezyId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const checkoutUrl = `https://lovable.lemonsqueezy.com/checkout/buy/${lemonSqueezyId}?checkout[custom][user_id]=${session.user.id}&checkout[email]=${session.user.email}`;
      
      if (window.createLemonSqueezy) {
        const lemonSqueezy = window.createLemonSqueezy();
        lemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      toast({
        title: "Error",
        description: "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Upgrade Your Plan</h1>
      
      {subscription?.status === 'trialing' && (
        <Card className="mb-8 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              Your trial ends in {
                Math.max(0, Math.ceil(
                  (new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                ))
              } days. Upgrade now to continue using all features.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            {plan.interval === 'yearly' && (
              <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Save 33%
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                ${plan.price_usd}/{plan.interval === 'monthly' ? 'month' : 'year'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-6">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Unlimited QR codes
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Custom branding
                </li>
              </ul>
              <Button 
                className="w-full"
                onClick={() => handleUpgrade(plan.id, plan.lemon_squeezy_id)}
                variant={plan.interval === 'yearly' ? 'default' : 'outline'}
              >
                {subscription?.status === 'trialing' ? 'Upgrade Now' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Upgrade;