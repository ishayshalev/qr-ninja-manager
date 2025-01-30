import { supabase } from "@/integrations/supabase/client";

export async function checkSubscriptionStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

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

    if (error) throw error;

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
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return null;
  }
}