import type {
  SubscriptionLimits,
  SubscriptionTier,
} from "@/domain/subscription/entity";
import type Subscription from "@/domain/subscription/entity";
import type SubscriptionRepository from "@/domain/subscription/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import addField, { type ParamCtx } from "@/infrastructure/utils/add_field";
import type { Pool } from "pg";

export default class SubscriptionAdapter implements SubscriptionRepository {
  pgPool: Pool;

  private readonly TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
      messagesPerDay: 20,
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

  async create(subscription: Subscription): Promise<Subscription> {
    if (
      !subscription.user_id ||
      !subscription.stripe_customer_id ||
      !subscription.stripe_subscription_id ||
      !subscription.plan_id ||
      !subscription.status ||
      !subscription.current_period_end
    ) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const values = [
      subscription.user_id,
      subscription.stripe_customer_id,
      subscription.stripe_subscription_id,
      subscription.plan_id,
      subscription.status,
      subscription.current_period_end,
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
      addField(
        ctx,
        "stripe_subscription_id",
        subscription.stripe_subscription_id,
      ),
      addField(ctx, "plan_id", subscription.plan_id),
      addField(ctx, "status", subscription.status),
      addField(ctx, "current_period_end", subscription.current_period_end),
      addField(ctx, "cancel_at", subscription.cancel_at ?? undefined),
      addField(ctx, "canceled_at", subscription.canceled_at ?? undefined),
    ].filter(Boolean);

    if (setClauses.length === 0) {
      throw new BadRequestError("No fields to update");
    }

    ctx.count += 1;
    ctx.values.push(subscription.id);

    const query = `
    UPDATE subscriptions
    SET ${setClauses.join(", ")}
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

    const query = `
    DELETE FROM subscriptions WHERE id = $1 AND user_id = $2;
    `;

    await this.pgPool.query(query, [sub_id, user_id]);
  }

  async findById(id: string): Promise<Subscription | null> {
    if (!id) {
      throw new BadRequestError("ID is required for this operation.");
    }

    const query = `SELECT * FROM subscriptions WHERE id = $1`;

    const result = await this.pgPool.query<Subscription>(query, [id]);

    if (result.rows.length < 1) {
      throw new BadRequestError("Subscription not found.");
    }

    return result.rows[0] ?? null;
  }

  async findByUserId(user_id: string): Promise<Subscription | null> {
    if (!user_id) {
      throw new BadRequestError("User ID is required for this operation.");
    }

    const query = `SELECT * FROM subscriptions WHERE user_id = $1`;

    const result = await this.pgPool.query<Subscription>(query, [user_id]);

    if (result.rows.length < 1) {
      throw new BadRequestError("Subscription not found.");
    }

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

    const query = `SELECT COUNT(*) as count 
       FROM chats 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '${interval}'`;

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
    status: Subscription["status"],
  ): Promise<void> {
    const query = `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2`;
    await this.pgPool.query(query, [status, subscriptionId]);
  }

  async updateUserTier(userId: string, tier: SubscriptionTier): Promise<void> {
    const query = `UPDATE users SET subscription_tier = $1 WHERE id = $2`;
    await this.pgPool.query(query, [tier, userId]);
  }
}
