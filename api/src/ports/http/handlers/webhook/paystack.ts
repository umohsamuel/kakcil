import type Adapter from "@/adapter";
import type Services from "@/service";
import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import EmailTemplatesService from "@/service/mail/template";
import MailService from "@/service/mail";

export default class WebhookHandler {
  adapter: Adapter;
  services: Services;

  router = Router();

  constructor(adapter: Adapter, services: Services) {
    this.adapter = adapter;
    this.services = services;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.get("/test", (req, res) => {
      res.json({ message: "Webhook endpoint is working!" });
    });
    this.router.post("/paystack", this.handlePaystackWebhook);
  }

  private handlePaystackWebhook = async (req: Request, res: Response) => {
    try {
      let rawBody: string;
      let event: any;

      if (req.body instanceof Buffer) {
        rawBody = req.body.toString("utf8");
        event = JSON.parse(rawBody);
      } else if (typeof req.body === "string") {
        rawBody = req.body;
        event = JSON.parse(rawBody);
      } else {
        rawBody = JSON.stringify(req.body);
        event = req.body;
      }

      const hash = crypto
        .createHmac("sha512", this.adapter.secrets.payStackSecretKey)
        .update(rawBody)
        .digest("hex");

      const paystackSignature = req.headers["x-paystack-signature"];

      if (hash !== paystackSignature) {
        console.error("Invalid webhook signature");
        console.error("Expected:", hash);
        console.error("Received:", paystackSignature);
        return res.status(400).json({ error: "Invalid signature" });
      }

      console.log(`Received Paystack webhook: ${event.event}`);

      switch (event.event) {
        case "charge.success":
          console.log("Handling charge.success");
          await this.handleChargeSuccess(event.data);
          break;

        case "subscription.create":
          console.log("Handling subscription.create");
          await this.handleSubscriptionCreate(event.data);
          break;

        case "subscription.disable":
          console.log("Handling subscription.disable");
          await this.handleSubscriptionDisable(event.data);
          break;

        case "subscription.not_renew":
          console.log("Handling subscription.not_renew");
          await this.handleSubscriptionNotRenew(event.data);
          break;

        case "invoice.create":
          console.log("Handling invoice.create");
          await this.handleInvoiceCreate(event.data);
          break;

        case "invoice.update":
          console.log("Handling invoice.update");
          await this.handleInvoiceUpdate(event.data);
          break;

        case "invoice.payment_failed":
          console.log("Handling invoice.payment_failed");
          await this.handleInvoicePaymentFailed(event.data);
          break;

        default:
          console.log(`Unhandled webhook event: ${event.event}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(200).json({ received: true, error: "Internal error" });
    }
  };

  private async handleChargeSuccess(data: PaystackChargeSuccess) {
    if (!data.plan || !data.plan.plan_code) {
      console.log("Charge is not for a subscription, skipping");
      return;
    }

    console.log("Charge is for subscription plan:", data.plan.plan_code);

    const user = await this.services.userService.getUserByEmail(
      data.customer.email,
    );

    if (!user) {
      console.error("User not found for email:", data.customer.email);
      return;
    }

    const plan = await this.adapter.subscriptionAdapter.getPlanByCode(
      data.plan.plan_code,
    );

    if (!plan) {
      console.error("Plan not found:", data.plan.plan_code);
      return;
    }

    const paymentQuery = `
      INSERT INTO payments (
        user_id,
        paystack_transaction_id,
        paystack_reference,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (paystack_reference) DO NOTHING
      RETURNING *
    `;

    await this.adapter.pgPool.query(paymentQuery, [
      user.id,
      data.id,
      data.reference,
      data.amount,
      data.currency,
      data.status,
      data.customer.email,
      "subscription_setup",
      data.authorization.authorization_code,
      data.authorization.bin,
      data.authorization.last4,
      data.authorization.card_type?.trim(),
      data.authorization.bank,
      data.authorization.brand,
      data.channel,
      data.gateway_response,
      data.fees,
      data.paid_at,
    ]);

    console.log("Payment record created");

    console.log("Waiting for subscription.create event from Paystack...");
  }

  private async handleSubscriptionCreate(data: PaystackSubscriptionData) {
    console.log("Creating subscription from webhook:", data);

    const user = await this.services.userService.getUserByEmail(
      data.customer.email,
    );

    if (!user) {
      console.error("User not found for email:", data.customer.email);
      return;
    }

    const plan = await this.adapter.subscriptionAdapter.getPlanByCode(
      data.plan.plan_code,
    );

    if (!plan) {
      console.error("Plan not found:", data.plan.plan_code);
      return;
    }

    const existingSubscription =
      await this.adapter.subscriptionAdapter.findByUserId(user.id as string);

    if (existingSubscription) {
      await this.adapter.subscriptionAdapter.update({
        id: existingSubscription.id,
        paystack_subscription_id: data.id,
        paystack_subscription_code: data.subscription_code,
        paystack_email_token: data.email_token,
        status: "active",
        next_payment_date: data.next_payment_date,
        current_period_end: data.next_payment_date,
        cron_expression: data.cron_expression,
        invoices_count: 0,
      });
    } else {
      await this.adapter.subscriptionAdapter.create({
        user_id: user.id as string,
        paystack_subscription_id: data.id,
        paystack_subscription_code: data.subscription_code,
        paystack_email_token: data.email_token,
        paystack_customer_id: data.customer.id,
        paystack_customer_code: data.customer.customer_code,
        plan_id: plan.id,
        paystack_plan_code: data.plan.plan_code,
        amount: data.amount,
        quantity: data.quantity || 1,
        paystack_authorization_code: data.authorization.authorization_code,
        card_bin: data.authorization.bin,
        card_last4: data.authorization.last4,
        card_type: data.authorization.card_type,
        card_bank: data.authorization.bank,
        card_brand: data.authorization.brand,
        card_exp_month: data.authorization.exp_month,
        card_exp_year: data.authorization.exp_year,
        status: "active",
        invoices_count: 0,
        next_payment_date: data.next_payment_date,
        current_period_start: new Date().toISOString(),
        current_period_end: data.next_payment_date,
        cron_expression: data.cron_expression,
      });
    }

    await this.adapter.subscriptionAdapter.updateUserTier(
      user.id as string,
      plan.tier,
    );

    const { subject, message } =
      new EmailTemplatesService().getSubscriptionSuccessEmail(
        user.email,
        plan.tier,
        data.amount,
      );

    await new MailService().sendEmail(user.email, subject, message);
  }

  private async handleSubscriptionDisable(data: PaystackSubscriptionData) {
    console.log("Disabling subscription from webhook:", data);

    const subscription =
      await this.adapter.subscriptionAdapter.findByPaystackSubscriptionCode(
        data.subscription_code,
      );

    if (!subscription) {
      console.error("Subscription not found:", data.subscription_code);
      return;
    }

    await this.adapter.subscriptionAdapter.update({
      id: subscription.id,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });

    await this.adapter.subscriptionAdapter.updateUserTier(
      subscription.user_id,
      "free",
    );

    const user = await this.services.userService.getUserById(
      subscription.user_id,
    );

    if (user) {
      const { subject, message } =
        new EmailTemplatesService().getSubscriptionCancelledEmail(
          user.email,
          new Date(subscription.current_period_end),
        );

      await new MailService().sendEmail(user.email, subject, message);
    }
  }

  private async handleSubscriptionNotRenew(data: PaystackSubscriptionData) {
    console.log("Subscription set to not renew from webhook:", data);

    const subscription =
      await this.adapter.subscriptionAdapter.findByPaystackSubscriptionCode(
        data.subscription_code,
      );

    if (!subscription) {
      console.error("Subscription not found:", data.subscription_code);
      return;
    }

    await this.adapter.subscriptionAdapter.update({
      id: subscription.id,
      status: "non-renewing",
      cancelled_at: new Date().toISOString(),
    });

    const user = await this.services.userService.getUserById(
      subscription.user_id,
    );
    if (user) {
      const { subject, message } =
        new EmailTemplatesService().getSubscriptionCancelledEmail(
          user.email,
          new Date(subscription.current_period_end),
        );

      await new MailService().sendEmail(user.email, subject, message);
    }
  }

  private async handleInvoiceCreate(data: any) {
    console.log("Unhandled yet, Invoice created:", data);
  }

  private async handleInvoiceUpdate(data: any) {
    console.log("Unhandled yet, Invoice updated:", data);
  }

  private async handleInvoicePaymentFailed(data: any) {
    console.log("Unhandled yet, Invoice payment failed:", data);
  }
}

export interface PaystackChargeSuccess {
  id: number;
  domain: "test" | "live";
  status: "success";
  reference: string;

  amount: number;
  message: string | null;
  gateway_response: string;

  paid_at: string;
  created_at: string;
  paidAt: string;

  channel:
    | "card"
    | "bank"
    | "ussd"
    | "qr"
    | "mobile_money"
    | "bank_transfer"
    | string;
  currency: string;
  ip_address: string;

  metadata: string | Record<string, unknown>;

  fees: number;
  fees_split: unknown | null;
  fees_breakdown: unknown | null;

  log: unknown | null;

  authorization: PaystackAuthorization;
  customer: PaystackCustomer;
  plan: PaystackPlan | null;

  subaccount: Record<string, unknown>;
  split: Record<string, unknown>;

  order_id: string | null;
  requested_amount: number;

  pos_transaction_data: unknown | null;

  source: PaystackSource | null;
}

export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: "card" | string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
}

export interface PaystackCustomer {
  id: number; // BIGINT
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: unknown | null;
  risk_action: "default" | "allow" | "deny";
  international_format_phone: string | null;
}

export interface PaystackPlan {
  id: number;
  name: string;
  plan_code: string;
  description: string;
  amount: number;
  interval: "daily" | "weekly" | "monthly" | "annually" | string;
  send_invoices: 0 | 1;
  send_sms: 0 | 1;
  currency: "NGN";
}

export interface PaystackSource {
  type: "api" | string;
  source: "merchant_api" | string;
  entry_point: "transaction_initialize" | string;
  identifier: string | null;
}

interface PaystackSubscriptionData {
  id: number;
  subscription_code: string;
  email_token: string;
  amount: number;
  cron_expression: string;
  next_payment_date: string;
  status: string;
  quantity: number;
  customer: {
    id: number;
    customer_code: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  plan: {
    id: number;
    name: string;
    plan_code: string;
    amount: number;
    interval: string;
  };
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    card_type: string;
    bank: string;
    brand: string;
  };
}
