import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "active" | "past_due" | "unpaid" | "cancelled" | "expired" | null;

export const checkSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking subscription:", error);
      return null;
    }

    return subscription?.status as SubscriptionStatus || null;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return null;
  }
};

export const createCheckoutSession = async (priceId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session found");

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        userId: session.user.id,
        email: session.user.email,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};