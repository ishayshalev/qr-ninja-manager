import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "active" | "past_due" | "unpaid" | "cancelled" | "expired" | null;

export const checkSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .single();

    return subscription?.status || null;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return null;
  }
};

export const createCheckoutSession = async (priceId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session found");

    const response = await fetch("/api/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
        userId: session.user.id,
        email: session.user.email,
      }),
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};