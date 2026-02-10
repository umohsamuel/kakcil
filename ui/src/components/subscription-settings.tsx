"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import { queryKeys } from "@/lib/query-keys";
import { SubscriptionBadge } from "@/components/subscription-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, BarChart3, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function SubscriptionSettings() {
  const { tier, limits, usage, subscription, isLoading } = useSubscription();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  if (isLoading) {
    return (
      <Card className="lg:border-border w-full border-2 border-none shadow-none lg:shadow">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:border-border w-full border-2 border-none shadow-none lg:shadow">
      <CardHeader className="px-0 lg:px-6">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" /> Subscription
        </CardTitle>
        <CardDescription>Your current plan and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0 lg:px-6">
        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Plan</p>
            <div className="mt-1">
              <SubscriptionBadge tier={tier} size="md" />
            </div>
          </div>
          {tier === "free" ? (
            <Button asChild size="sm">
              <Link href="/subscription">Upgrade</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/subscription">Manage Plan</Link>
            </Button>
          )}
        </div>

        {/* Usage Stats */}
        {limits && usage && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4" /> Usage
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Messages Today</p>
                <p className="mt-1 text-lg font-semibold">
                  {usage.daily}
                  <span className="text-muted-foreground text-sm font-normal">
                    {" "}
                    /{" "}
                    {limits.messagesPerDay === Infinity
                      ? "∞"
                      : limits.messagesPerDay}
                  </span>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  Messages This Month
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {usage.monthly}
                  <span className="text-muted-foreground text-sm font-normal">
                    {" "}
                    /{" "}
                    {limits.messagesPerMonth === Infinity
                      ? "∞"
                      : limits.messagesPerMonth}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        {subscription && subscription.status !== "cancelled" && (
          <div className="space-y-2 border-t pt-4">
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Status</span>
              <span className="capitalize">{subscription.status}</span>
            </div>
            {subscription.next_payment_date && (
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>Next Payment</span>
                <span>
                  {new Date(
                    subscription.next_payment_date,
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription.card_last4 && (
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>Card</span>
                <span>
                  •••• {subscription.card_last4}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Subscription */}
        {subscription &&
          (subscription.status === "active" ||
            subscription.status === "trialing") && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.",
                    )
                  ) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                )}
                Cancel Subscription
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
