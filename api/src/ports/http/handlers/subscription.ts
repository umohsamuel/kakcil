import type Adapter from "@/adapter";
import type { IUser } from "@/domain/user/entity";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { ErrorResponse } from "@/infrastructure/responses/error";
import { SuccessResponse } from "@/infrastructure/responses/success";
import type Services from "@/service";
import MailService from "@/service/mail";
import EmailTemplatesService from "@/service/mail/template";
import { Router, type Request, type Response } from "express";

export default class SubscriptionHandler {
  adapter: Adapter;
  services: Services;

  router = Router();

  constructor(adapter: Adapter, services: Services) {
    this.adapter = adapter;
    this.services = services;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.get("/plans", this.getPlans);
    this.router.post("/paystack/initialize", this.initializePayment);
    this.router.get("/paystack/verify", this.verifyPayment);
    this.router.post("/cancel", this.cancelSubscription);
    this.router.get("/status", this.getSubscriptionStatus);
  }

  private getPlans = async (_req: Request, res: Response) => {
    const plans = await this.adapter.subscriptionAdapter.getPlans();
    return new SuccessResponse(res, plans).send();
  };

  private initializePayment = async (req: Request, res: Response) => {
    const { email, amount, sub_tier } = req.body;

    const response =
      await this.services.paymentService.initializePaystackPayment(
        email,
        amount,
        sub_tier,
      );

    return new SuccessResponse(res, response).send();
  };

  private verifyPayment = async (req: Request, res: Response) => {
    const reference = req.query.reference;
    const { id, email } = req.user as IUser;

    if (!id) {
      throw new BadRequestError("User not found");
    }

    const response = await this.services.paymentService.verifyPaystackPayment(
      reference as string,
    );

    if (response.data.status === "success") {
      await this.adapter.subscriptionAdapter.baseStorePaymentForWebhookToCreateSubscription(
        email,
        id,
        response,
      );

      return new SuccessResponse(res, {
        message:
          "Payment verified successfully. Your subscription will be activated shortly.",
        data: response.data,
      }).send();
    } else {
      return new ErrorResponse(res, "Payment verification failed").send();
    }
  };

  private cancelSubscription = async (req: Request, res: Response) => {
    const { id, email } = req.user as IUser;

    const subscription = await this.adapter.subscriptionAdapter.findByUserId(
      id as string,
    );

    if (!subscription) {
      throw new BadRequestError("No active subscription found");
    }

    await this.services.paymentService.cancelPaystackSubscription(
      subscription.paystack_subscription_code,
      subscription.paystack_email_token,
    );

    await this.adapter.subscriptionAdapter.cancelSubscription(id as string);

    const { subject, message } =
      new EmailTemplatesService().getSubscriptionCancelledEmail(
        email || "User",
        new Date(subscription.current_period_end),
      );

    await new MailService().sendEmail(email || "", subject, message);

    new SuccessResponse(res, {
      message:
        "Subscription cancelled successfully. It will remain active until the end of the current billing period.",
      endDate: subscription.current_period_end,
    }).send();
  };

  private getSubscriptionStatus = async (req: Request, res: Response) => {
    const { id } = req.user as IUser;

    const subscription = await this.adapter.subscriptionAdapter.findByUserId(
      id as string,
    );
    const tier = await this.adapter.subscriptionAdapter.getUserTier(
      id as string,
    );
    const limits = await this.adapter.subscriptionAdapter.getUserLimits(
      id as string,
    );
    const usage = {
      daily: await this.adapter.subscriptionAdapter.getMessageCount(
        id as string,
        "day",
      ),
      monthly: await this.adapter.subscriptionAdapter.getMessageCount(
        id as string,
        "month",
      ),
    };

    new SuccessResponse(res, {
      subscription,
      tier,
      limits,
      usage,
    }).send();
  };
}
