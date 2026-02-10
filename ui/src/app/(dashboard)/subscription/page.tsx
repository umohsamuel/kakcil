"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useSubscription, useSubscriptionPlans } from "@/hooks/use-subscription";
import { useAuthStore } from "@/store/auth.store";
import { subscriptionService } from "@/services/subscription.service";
import { SubscriptionBadge } from "@/components/subscription-badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Check,
  Loader2,
  Zap,
  Infinity as InfinityIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { SubscriptionTier, PaystackPlan } from "@/types/subscription";

const TIER_LIMITS: Record<
  SubscriptionTier,
  { messagesPerDay: number | null; messagesPerMonth: number | null; maxCouncilMembers: number | null; canUseAdvancedModels: boolean }
> = {
  free: {
    messagesPerDay: 2,
    messagesPerMonth: 100,
    maxCouncilMembers: 3,
    canUseAdvancedModels: false,
  },
  plus: {
    messagesPerDay: 500,
    messagesPerMonth: 10000,
    maxCouncilMembers: 10,
    canUseAdvancedModels: true,
  },
  pro: {
    messagesPerDay: null, // Infinity
    messagesPerMonth: null,
    maxCouncilMembers: null,
    canUseAdvancedModels: true,
  },
};

interface TierCardProps {
  tierKey: SubscriptionTier;
  name: string;
  price: number | null; // in naira
  interval?: string;
  currentTier: SubscriptionTier;
  isUpgrading: boolean;
  onUpgrade: () => void;
}

function TierCard({
  tierKey,
  name,
  price,
  interval,
  currentTier,
  isUpgrading,
  onUpgrade,
}: TierCardProps) {
  const isCurrent = tierKey === currentTier;
  const limits = TIER_LIMITS[tierKey];
  const isPopular = tierKey === "plus";

  const features = [
    {
      label: "Messages per day",
      value: limits.messagesPerDay === null ? "Unlimited" : `${limits.messagesPerDay}`,
    },
    {
      label: "Messages per month",
      value: limits.messagesPerMonth === null ? "Unlimited" : `${limits.messagesPerMonth?.toLocaleString()}`,
    },
    {
      label: "Council members",
      value: limits.maxCouncilMembers === null ? "Unlimited" : `${limits.maxCouncilMembers}`,
    },
    {
      label: "Advanced models",
      value: limits.canUseAdvancedModels ? "Included" : "Not available",
    },
  ];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
        isPopular
          ? "border-violet-500 shadow-lg shadow-violet-500/10"
          : isCurrent
            ? "border-foreground/20"
            : "border-border hover:border-foreground/20"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold capitalize">{name}</h3>
          {isCurrent && <SubscriptionBadge tier={tierKey} size="sm" />}
        </div>
        <div className="mt-2">
          {price === null || price === 0 ? (
            <span className="text-3xl font-bold">Free</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                ₦{price.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm">
                /{interval || "month"}
              </span>
            </div>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            {f.value === "Not available" ? (
              <span className="text-muted-foreground mt-0.5 h-4 w-4 text-center text-xs">
                —
              </span>
            ) : f.value === "Unlimited" ? (
              <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            )}
            <span>
              <span className="text-muted-foreground">{f.label}: </span>
              <span className="font-medium">{f.value}</span>
            </span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button disabled variant="outline" className="w-full">
          Current Plan
        </Button>
      ) : tierKey === "free" ? (
        <Button disabled variant="outline" className="w-full">
          Default Plan
        </Button>
      ) : (
        <Button
          onClick={onUpgrade}
          disabled={isUpgrading}
          className={`w-full ${
            isPopular
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
              : ""
          }`}
        >
          {isUpgrading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Upgrade to {name}
        </Button>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const { tier } = useSubscription();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  const handleUpgrade = async (subTier: SubscriptionTier, amount: number) => {
    if (!user?.email) {
      toast.error("Unable to get user email");
      return;
    }

    setUpgradingTier(subTier);
    try {
      const response = await subscriptionService.initializePayment(
        user.email,
        amount / 100, // backend multiplies by 100 again
        subTier,
      );
      // Redirect to Paystack checkout
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Failed to initialize payment");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize payment";
      toast.error(message);
    } finally {
      setUpgradingTier(null);
    }
  };

  // Build tier data from plans API
  const getPlanPrice = (t: SubscriptionTier): { price: number; interval: string } => {
    const plan = plans.find((p: PaystackPlan) => p.tier === t);
    if (plan) {
      return { price: plan.amount / 100, interval: plan.interval };
    }
    return { price: 0, interval: "monthly" };
  };

  const getPlanAmount = (t: SubscriptionTier): number => {
    const plan = plans.find((p: PaystackPlan) => p.tier === t);
    return plan?.amount ?? 0;
  };

  return (
    <ProtectedRoute>
      <main className="bg-background text-foreground relative flex flex-1 flex-col overflow-hidden overflow-y-auto lg:h-[calc(100dvh-1.5rem)] lg:rounded-tl-4xl">
        <div className="mx-auto w-full max-w-5xl space-y-8 p-4 lg:p-8">
          {/* Header */}
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link href="/chat">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chat
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight">
                <Crown className="h-8 w-8" /> Choose Your Plan
              </h1>
              <p className="text-muted-foreground mt-2">
                Unlock more messages, advanced models, and bigger councils.
              </p>
            </div>
          </div>

          {/* Tier Cards */}
          {plansLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {(["free", "plus", "pro"] as SubscriptionTier[]).map((t) => {
                const { price, interval } = getPlanPrice(t);
                return (
                  <TierCard
                    key={t}
                    tierKey={t}
                    name={t.charAt(0).toUpperCase() + t.slice(1)}
                    price={price}
                    interval={interval}
                    currentTier={tier}
                    isUpgrading={upgradingTier === t}
                    onUpgrade={() => handleUpgrade(t, getPlanAmount(t))}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
