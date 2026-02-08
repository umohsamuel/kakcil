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

export default interface Subscription {
  id: string;
  user_id: string;

  // Paystack subscription details
  paystack_subscription_id: number;
  paystack_subscription_code: string;
  paystack_email_token: string;

  // Customer details
  paystack_customer_id: number;
  paystack_customer_code: string;

  // Plan reference
  plan_id: string; // UUID reference to paystack_plans table
  paystack_plan_code: string;

  // Subscription details
  amount: number; // In kobo
  quantity: number;

  // Authorization
  paystack_authorization_code: string;
  card_bin?: string;
  card_last4?: string;
  card_type?: string;
  card_bank?: string;
  card_brand?: string;
  card_exp_month?: string;
  card_exp_year?: string;

  // Status
  status: SubscriptionStatus;

  // Invoice tracking
  invoices_count: number;
  invoice_limit?: number;

  // Subscription period
  next_payment_date?: string;
  current_period_start: string;
  current_period_end: string;

  // Cancellation
  cancelled_at?: string;

  // Metadata
  cron_expression?: string;
  most_recent_invoice?: string;

  // Timestamps
  // created_at: Date;
  // updated_at: Date;
}

export interface PaystackPlan {
  id: string; // UUID

  // Paystack plan details
  paystack_plan_id: number;
  paystack_plan_code: string;

  // Plan configuration
  name: string;
  interval:
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "biannually"
    | "annually";
  amount: number; // in kobo
  currency: string; // 'NGN'

  // Internal mapping
  tier: "free" | "plus" | "pro";

  // Plan settings
  invoice_limit: number | null;
  send_invoices: boolean;
  send_sms: boolean;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Payment {
  id: string; // UUID
  user_id: string; // UUID

  // Paystack transaction details
  paystack_transaction_id: number;
  paystack_reference: string;
  paystack_access_code: string | null;

  // Payment details
  amount: number; // in kobo
  currency: string; // 'NGN'
  status: "success" | "failed" | "pending" | "abandoned";

  // Customer info
  email: string;

  // Payment purpose
  payment_type: "subscription_setup" | "one_time" | "upgrade" | "addon" | null;

  // Authorization details
  authorization_code: string | null;
  card_bin: string | null;
  card_last4: string | null;
  card_type: string | null;
  card_bank: string | null;
  card_brand: string | null;

  // Transaction metadata
  channel: string | null;
  gateway_response: string | null;
  fees: number | null; // in kobo

  // Timestamps
  paid_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
