import type Adapter from "@/adapter";
import type Services from "@/service";
import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
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
    this.router.post("/paystack", this.handlePaystackWebhook);
  }

  private handlePaystackWebhook = async (req: Request, res: Response) => {
    try {
      const hash = crypto
        .createHmac("sha512", this.adapter.secrets.payStackSecretKey)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        throw new BadRequestError("Invalid webhook signature");
      }

      const event = req.body;

      console.log(`Received Paystack webhook: ${event.event}`);

      switch (event.event) {
        case "subscription.create":
          await this.handleSubscriptionCreate(event.data);
          break;

        case "subscription.disable":
          await this.handleSubscriptionDisable(event.data);
          break;

        case "subscription.not_renew":
          await this.handleSubscriptionNotRenew(event.data);
          break;

        default:
          console.log(`Unhandled webhook event: ${event.event}`);
      }

      res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Webhook error:", error);
      // Still return 200 to prevent Paystack from retrying
      res.status(200).send("Webhook received with errors");
    }
  };

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
