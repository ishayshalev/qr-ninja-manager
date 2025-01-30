import { useQuery } from "@tanstack/react-query";
import { checkSubscriptionStatus } from "@/lib/subscription";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: checkSubscriptionStatus,
  });
}