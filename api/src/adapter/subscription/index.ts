import type {
  PaystackPlan,
  SubscriptionLimits,
  SubscriptionStatus,
  SubscriptionTier,
} from "@/domain/subscription/entity";
import type Subscription from "@/domain/subscription/entity";
import type SubscriptionRepository from "@/domain/subscription/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import addField, { type ParamCtx } from "@/infrastructure/utils/add_field";
import type { PaystackVerifyResponse } from "@/service/payment";
import type { Pool } from "pg";

export default class SubscriptionAdapter implements SubscriptionRepository {
  pgPool: Pool;

  private readonly TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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
      messagesPerDay: Infinity,
      messagesPerMonth: Infinity,
      maxCouncilMembers: Infinity,
      canUseAdvancedModels: true,
    },
  };

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async create(
    subscription: Omit<Subscription, "id" | "created_at" | "updated_at">,
  ): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (
        user_id,
        paystack_subscription_id,
        paystack_subscription_code,
        paystack_email_token,
        paystack_customer_id,
        paystack_customer_code,
        plan_id,
        paystack_plan_code,
        amount,
        quantity,
        paystack_authorization_code,
        card_bin,
        card_last4,
        card_type,
        card_bank,
        card_brand,
        card_exp_month,
        card_exp_year,
        status,
        invoices_count,
        invoice_limit,
        next_payment_date,
        current_period_start,
        current_period_end,
        cron_expression,
        most_recent_invoice
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;

    const values = [
      subscription.user_id,
      subscription.paystack_subscription_id,
      subscription.paystack_subscription_code,
      subscription.paystack_email_token,
      subscription.paystack_customer_id,
      subscription.paystack_customer_code,
      subscription.plan_id,
      subscription.paystack_plan_code,
      subscription.amount,
      subscription.quantity || 1,
      subscription.paystack_authorization_code,
      subscription.card_bin || null,
      subscription.card_last4 || null,
      subscription.card_type || null,
      subscription.card_bank || null,
      subscription.card_brand || null,
      subscription.card_exp_month || null,
      subscription.card_exp_year || null,
      subscription.status,
      subscription.invoices_count || 0,
      subscription.invoice_limit || null,
      subscription.next_payment_date || null,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cron_expression || null,
      subscription.most_recent_invoice || null,
    ];

    const result = await this.pgPool.query<Subscription>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new Error("Failed to create subscription");
    }

    return result.rows[0];
  }

  async update(
    subscription: Partial<Subscription> & { id: string },
  ): Promise<Subscription> {
    if (!subscription.id) {
      throw new BadRequestError("Subscription ID is required for update");
    }

    const ctx: ParamCtx = {
      values: [],
      count: 0,
    };

    const setClauses = [
      addField(ctx, "status", subscription.status),
      addField(ctx, "next_payment_date", subscription.next_payment_date),
      addField(ctx, "current_period_end", subscription.current_period_end),
      addField(ctx, "invoices_count", subscription.invoices_count),
      addField(ctx, "most_recent_invoice", subscription.most_recent_invoice),
      addField(ctx, "cancelled_at", subscription.cancelled_at),
    ].filter(Boolean);

    if (setClauses.length === 0) {
      throw new BadRequestError("No fields to update");
    }

    ctx.count += 1;
    ctx.values.push(subscription.id);

    const query = `
      UPDATE subscriptions
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${ctx.count}
      RETURNING *
    `;

    const result = await this.pgPool.query<Subscription>(query, ctx.values);

    if (!result.rows[0]) {
      throw new BadRequestError("Subscription not found");
    }

    return result.rows[0];
  }

  async delete(user_id: string, sub_id: string): Promise<void> {
    if (!user_id || !sub_id) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2`;
    await this.pgPool.query(query, [sub_id, user_id]);
  }

  async findById(id: string): Promise<Subscription | null> {
    if (!id) {
      throw new BadRequestError("ID is required for this operation.");
    }

    const query = `SELECT * FROM subscriptions WHERE id = $1`;
    const result = await this.pgPool.query<Subscription>(query, [id]);

    return result.rows[0] ?? null;
  }

  async findByUserId(user_id: string): Promise<Subscription | null> {
    if (!user_id) {
      throw new BadRequestError("User ID is required for this operation.");
    }

    const query = `SELECT * FROM subscriptions WHERE user_id = $1`;
    const result = await this.pgPool.query<Subscription>(query, [user_id]);

    return result.rows[0] ?? null;
  }

  async findByPaystackSubscriptionCode(
    code: string,
  ): Promise<Subscription | null> {
    if (!code) {
      throw new BadRequestError("Subscription code is required.");
    }

    const query = `SELECT * FROM subscriptions WHERE paystack_subscription_code = $1`;
    const result = await this.pgPool.query<Subscription>(query, [code]);

    return result.rows[0] ?? null;
  }

  async getUserTier(userId: string): Promise<SubscriptionTier> {
    if (!userId) {
      throw new BadRequestError("User ID is required for this operation.");
    }

    const query = `SELECT subscription_tier FROM users WHERE id = $1`;
    const result = await this.pgPool.query<{
      subscription_tier: SubscriptionTier;
    }>(query, [userId]);

    return result.rows[0]?.subscription_tier || "free";
  }

  async getTierLimits(tier: SubscriptionTier): Promise<SubscriptionLimits> {
    return this.TIER_LIMITS[tier];
  }

  async getUserLimits(userId: string): Promise<SubscriptionLimits> {
    const tier = await this.getUserTier(userId);
    return this.getTierLimits(tier);
  }

  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      return false;
    }

    return (
      subscription.status === "active" || subscription.status === "trialing"
    );
  }

  async getMessageCount(
    userId: string,
    period: "day" | "month",
  ): Promise<number> {
    const interval = period === "day" ? "1 day" : "1 month";

    const query = `
      SELECT COUNT(*) as count 
      FROM chats 
      WHERE user_id = $1 
      AND created_at > NOW() - INTERVAL '${interval}'
    `;

    const result = await this.pgPool.query<{ count: string }>(query, [userId]);

    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async checkMessageLimit(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    limits: SubscriptionLimits;
    usage: {
      daily: number;
      monthly: number;
    };
  }> {
    const limits = await this.getUserLimits(userId);
    const dailyCount = await this.getMessageCount(userId, "day");
    const monthlyCount = await this.getMessageCount(userId, "month");

    if (dailyCount >= limits.messagesPerDay) {
      return {
        allowed: false,
        reason: `Daily message limit reached (${limits.messagesPerDay} messages)`,
        limits,
        usage: { daily: dailyCount, monthly: monthlyCount },
      };
    }

    if (monthlyCount >= limits.messagesPerMonth) {
      return {
        allowed: false,
        reason: `Monthly message limit reached (${limits.messagesPerMonth} messages)`,
        limits,
        usage: { daily: dailyCount, monthly: monthlyCount },
      };
    }

    return {
      allowed: true,
      limits,
      usage: { daily: dailyCount, monthly: monthlyCount },
    };
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    const query = `
      UPDATE subscriptions 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    await this.pgPool.query(query, [status, subscriptionId]);
  }

  async updateUserTier(userId: string, tier: SubscriptionTier): Promise<void> {
    const query = `
      UPDATE users 
      SET subscription_tier = $1, subscription_status = 'active'
      WHERE id = $2
    `;
    await this.pgPool.query(query, [tier, userId]);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const query = `
      UPDATE subscriptions 
      SET status = 'non-renewing', cancelled_at = NOW(), updated_at = NOW()
      WHERE user_id = $1
    `;
    await this.pgPool.query(query, [userId]);
  }

  async getPlanByCode(planCode: string): Promise<PaystackPlan | null> {
    const query = `
      SELECT id, tier, amount 
      FROM paystack_plans 
      WHERE paystack_plan_code = $1 AND is_active = true
    `;
    const result = await this.pgPool.query<PaystackPlan>(query, [planCode]);

    return result.rows[0] ?? null;
  }

  async baseStorePaymentForWebhookToCreateSubscription(
    email: string,
    payload: PaystackVerifyResponse,
  ) {
    const query = `
      INSERT INTO payments (
        user_id,
        paystack_transaction_id,
        paystack_reference,
        paystack_access_code,
        amount,
        currency,
        status,
        email,
        payment_type,
        authorization_code,
        card_bin,
        card_last4,
        card_type,
        card_bank,
        card_brand,
        channel,
        gateway_response,
        fees,
        paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (paystack_reference) DO NOTHING RETURNING *
    `;

    const result = await this.pgPool.query(query, [
      payload.data.id,
      payload.data.id,
      payload.data.reference,
      null,
      payload.data.amount,
      payload.data.currency,
      payload.data.status,
      email,
      "subscription_setup",
      payload.data.authorization.authorization_code,
      payload.data.authorization.bin,
      payload.data.authorization.last4,
      payload.data.authorization.card_type,
      payload.data.authorization.bank,
      payload.data.authorization.brand,
      payload.data.channel,
      payload.data.gateway_response,
      payload.data.fees,
      payload.data.paid_at,
    ]);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new Error("Failed to store payment");
    }

    return result.rows[0] ?? null;
  }
}
