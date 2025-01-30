import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No session found");
        return null;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            interval,
            price_usd
          )
        `)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        throw error;
      }

      console.log("Fetched subscription:", subscription);

      if (!subscription) return null;

      const now = new Date();
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const subscriptionEnd = subscription.current_period_ends_at ? new Date(subscription.current_period_ends_at) : null;

      return {
        ...subscription,
        isActive: 
          (subscription.status === 'trialing' && trialEnd && trialEnd > now) ||
          (subscription.status === 'active' && subscriptionEnd && subscriptionEnd > now),
        isTrialing: subscription.status === 'trialing' && trialEnd && trialEnd > now,
      };
    },
  });
}