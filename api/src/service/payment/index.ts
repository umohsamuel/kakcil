import type Adapter from "@/adapter";
import type { SubscriptionTier } from "@/domain/subscription/entity";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import axios from "axios";

export default class PaymentService {
  adapter: Adapter;

  constructor(adapter: Adapter) {
    this.adapter = adapter;
  }

  async initializePaystackPayment(
    email: string,
    amount: number,
    sub_tier: Omit<SubscriptionTier, "free">,
  ): Promise<PaystackInitializeResponse> {
    if (!email || !amount || !sub_tier) {
      throw new BadRequestError("Missing required fields");
    }

    if (sub_tier !== "plus" && sub_tier !== "pro") {
      throw new BadRequestError("Invalid subscription tier");
    }

    const plans_code = {
      plus: "PLN_sly2k8ix0wcwwoj",
      pro: "PLN_cmeqxx4ftssqtmn",
    };

    try {
      const url = `https://api.paystack.co/transaction/initialize`;

      const response = await axios.post<PaystackInitializeResponse>(
        url,
        {
          email,
          amount: amount * 100,
          plan: plans_code[sub_tier as keyof typeof plans_code],
        },
        {
          headers: {
            Authorization: `Bearer ${this.adapter.secrets.payStackSecretKey}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.log("error in initializePaystackPayment: ", error);
      throw new BadRequestError("Failed to initialize payment");
    }
  }

  async verifyPaystackPayment(
    reference: string,
  ): Promise<PaystackVerifyResponse> {
    if (!reference) {
      throw new BadRequestError("transaction reference is required");
    }

    try {
      const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;

      const response = await axios.get<PaystackVerifyResponse>(url, {
        headers: {
          Authorization: `Bearer ${this.adapter.secrets.payStackSecretKey}`,
          "cache-control": "no-cache",
        },
      });

      return response.data;
    } catch (error) {
      console.log("error in verifyPaystackPayment: ", error);
      throw new BadRequestError("Failed to verify payment");
    }
  }

  async cancelPaystackSubscription(
    subscriptionCode: string,
    emailToken: string,
  ): Promise<void> {
    try {
      const url = `https://api.paystack.co/subscription/disable`;

      await axios.post(
        url,
        {
          code: subscriptionCode,
          token: emailToken,
        },
        {
          headers: {
            Authorization: `Bearer ${this.adapter.secrets.payStackSecretKey}`,
          },
        },
      );
    } catch (error) {
      console.error("error in cancelPaystackSubscription: ", error);
      throw new BadRequestError("Failed to cancel subscription");
    }
  }
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    receipt_number: string | null;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: string;
    log: {
      start_time: number;
      time_spent: number;
      attempts: number;
      errors: number;
      success: boolean;
      mobile: boolean;
      input: unknown[];
      history: {
        type: string;
        message: string;
        time: number;
      }[];
    };
    fees: number;
    fees_split: unknown | null;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: unknown | null;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: {
      plan_code: string;
    } | null;
    split: Record<string, unknown>;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: unknown | null;
    source: unknown | null;
    fees_breakdown: unknown | null;
    connect: unknown | null;
    transaction_date: string;
    plan_object: Record<string, unknown>;
    subaccount: Record<string, unknown>;
  };
}
