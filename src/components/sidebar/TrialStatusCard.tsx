import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

export function TrialStatusCard() {
  const { data: subscription, isLoading, error } = useSubscription();

  console.log("Trial Status:", {
    subscription,
    isLoading,
    error,
    isTrialing: subscription?.isTrialing,
    trialEndsAt: subscription?.trial_ends_at
  });

  if (isLoading || error || !subscription?.isTrialing || !subscription.trial_ends_at) {
    console.log("Not showing trial card because:", {
      isLoading,
      error,
      isTrialing: subscription?.isTrialing,
      trialEndsAt: subscription?.trial_ends_at
    });
    return null;
  }

  const daysLeft = differenceInDays(
    new Date(subscription.trial_ends_at),
    new Date()
  );

  if (daysLeft <= 0) {
    console.log("Trial has ended, days left:", daysLeft);
    return null;
  }

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
          onClick={() => window.open("/upgrade", "_blank")}
        >
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}