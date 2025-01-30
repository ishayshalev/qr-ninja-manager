import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

export const SubscriptionStatus = () => {
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (
            name,
            interval
          )
        `)
        .eq("user_id", session.session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (!subscription) return null;

  const isTrialing = subscription.status === "trialing";
  const isActive = subscription.status === "active";
  const endDate = isTrialing ? subscription.trial_ends_at : subscription.current_period_ends_at;

  if (!isTrialing && !isActive) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isTrialing ? "secondary" : "default"}>
        {isTrialing ? "Trial" : subscription.subscription_plans?.name}
      </Badge>
      {endDate && (
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-1 h-4 w-4" />
          {isTrialing ? "Trial ends" : "Renews"} {format(new Date(endDate), "MMM d, yyyy")}
        </div>
      )}
    </div>
  );
};