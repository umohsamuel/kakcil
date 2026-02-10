import type {
  SubscriptionLimits,
  SubscriptionTier,
  SubscriptionStatus,
  PaystackPlan,
} from "./entity";
import type Subscription from "./entity";

export default interface SubscriptionRepository {
  create(
    subscription: Omit<Subscription, "id" | "created_at" | "updated_at">,
  ): Promise<Subscription>;

  update(
    subscription: Partial<Subscription> & { id: string },
  ): Promise<Subscription>;

  delete(user_id: string, sub_id: string): Promise<void>;

  findById(id: string): Promise<Subscription | null>;

  findByUserId(user_id: string): Promise<Subscription | null>;

  findByPaystackSubscriptionCode(code: string): Promise<Subscription | null>;

  getUserTier(userId: string): Promise<SubscriptionTier>;

  getTierLimits(tier: SubscriptionTier): Promise<SubscriptionLimits>;

  getUserLimits(userId: string): Promise<SubscriptionLimits>;

  isSubscriptionActive(userId: string): Promise<boolean>;

  getMessageCount(userId: string, period: "day" | "month"): Promise<number>;

  checkMessageLimit(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    limits: SubscriptionLimits;
    usage: {
      daily: number;
      monthly: number;
    };
  }>;

  updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void>;

  updateUserTier(userId: string, tier: SubscriptionTier): Promise<void>;

  cancelSubscription(userId: string): Promise<void>;

  getPlanByCode(planCode: string): Promise<PaystackPlan | null>;

  getPlans(): Promise<PaystackPlan[]>;
}
