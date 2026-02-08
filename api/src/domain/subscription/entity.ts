export default interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_id: string;
  status:
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "trialing"
    | "unpaid"
    | "paused";
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
}

export type SubscriptionTier = "free" | "plus" | "pro";

export interface SubscriptionLimits {
  messagesPerDay: number;
  messagesPerMonth: number;
  maxCouncilMembers: number;
  canUseAdvancedModels: boolean;
}
