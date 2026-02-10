export type SubscriptionTier = "free" | "plus" | "pro";

export type SubscriptionStatus =
  | "active"
  | "non-renewing"
  | "attention"
  | "completed"
  | "cancelled"
  | "trialing"
  | "paused";

export interface SubscriptionLimits {
  messagesPerDay: number;
  messagesPerMonth: number;
  maxCouncilMembers: number;
  canUseAdvancedModels: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  paystack_subscription_id: number;
  paystack_subscription_code: string;
  paystack_email_token: string;
  paystack_customer_id: number;
  paystack_customer_code: string;
  plan_id: string;
  paystack_plan_code: string;
  amount: number;
  quantity: number;
  paystack_authorization_code: string;
  card_last4?: string;
  card_type?: string;
  card_bank?: string;
  card_brand?: string;
  status: SubscriptionStatus;
  invoices_count: number;
  invoice_limit?: number;
  next_payment_date?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
}

export interface PaystackPlan {
  id: string;
  paystack_plan_id: number;
  paystack_plan_code: string;
  name: string;
  interval: "hourly" | "daily" | "weekly" | "monthly" | "biannually" | "annually";
  amount: number; // in kobo
  currency: string;
  tier: SubscriptionTier;
  invoice_limit: number | null;
  send_invoices: boolean;
  send_sms: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatusResponse {
  subscription: Subscription | null;
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  usage: {
    daily: number;
    monthly: number;
  };
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: PaystackInitializeData;
}

export interface RateLimitError {
  error: string;
  message: string;
  limits: SubscriptionLimits;
  usage: {
    daily: number;
    monthly: number;
  };
  upgradeUrl: string;
}
