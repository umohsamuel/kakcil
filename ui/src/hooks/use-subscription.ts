import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import { queryKeys } from "@/lib/query-keys";

export function useSubscription() {
  const query = useQuery({
    queryKey: queryKeys.subscription.status(),
    queryFn: () => subscriptionService.getSubscriptionStatus(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    subscription: query.data?.subscription ?? null,
    tier: query.data?.tier ?? "free",
    limits: query.data?.limits ?? null,
    usage: query.data?.usage ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSubscriptionPlans() {
  const query = useQuery({
    queryKey: queryKeys.subscription.plans(),
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 1000 * 60 * 30, // 30 minutes — plans rarely change
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
