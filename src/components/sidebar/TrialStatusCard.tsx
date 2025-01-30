import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";

export function TrialStatusCard() {
  const { data: subscription, isLoading, error } = useSubscription();

  console.log("Trial Status Card Render:", {
    subscription,
    isLoading,
    error,
    status: subscription?.status,
    trialEndsAt: subscription?.trial_ends_at,
    isTrialing: subscription?.status === 'trialing'
  });

  if (isLoading) {
    console.log("Loading subscription data...");
    return null;
  }

  if (error) {
    console.error("Error loading subscription:", error);
    return null;
  }

  if (!subscription || subscription.status !== 'trialing' || !subscription.trial_ends_at) {
    console.log("Not showing trial card because:", {
      hasSubscription: !!subscription,
      status: subscription?.status,
      trialEndsAt: subscription?.trial_ends_at
    });
    return null;
  }

  const daysLeft = differenceInDays(
    new Date(subscription.trial_ends_at),
    new Date()
  );

  console.log("Days left in trial:", daysLeft);

  if (daysLeft <= 0) {
    console.log("Trial has ended");
    return null;
  }

  const handleUpgrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const productId = "439912";
      const successUrl = `${window.location.origin}/`;
      const checkoutUrl = `https://shalev-agency.lemonsqueezy.com/checkout/buy/${productId}?checkout[custom][user_id]=${session.user.id}&checkout[email]=${session.user.email}&checkout[success_url]=${encodeURIComponent(successUrl)}`;
      
      console.log('Opening Lemon Squeezy checkout URL:', checkoutUrl);
      
      if (window.createLemonSqueezy) {
        const lemonSqueezy = window.createLemonSqueezy();
        lemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening checkout:', error);
    }
  };

  return (
    <Card className="bg-[#F1F0FB] border-none shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-primary" />
          <span>{daysLeft} days left in trial</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Upgrade to yearly plan to save 40%
        </p>
        <Button
          size="sm"
          className="w-full"
          onClick={handleUpgrade}
        >
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}