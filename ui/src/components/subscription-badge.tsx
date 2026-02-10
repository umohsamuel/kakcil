"use client";

import type { SubscriptionTier } from "@/types/subscription";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<
  SubscriptionTier,
  { label: string; className: string }
> = {
  free: {
    label: "Free",
    className:
      "bg-muted text-muted-foreground border border-border",
  },
  plus: {
    label: "Plus",
    className:
      "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-500/30",
  },
  pro: {
    label: "Pro",
    className:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-400/30",
  },
};

export function SubscriptionBadge({ tier, size = "sm" }: SubscriptionBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
