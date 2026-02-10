import { apiClient } from "@/lib/api-client";
import type {
  PaystackInitializeResponse,
  PaystackPlan,
  SubscriptionStatusResponse,
} from "@/types/subscription";

export class SubscriptionService {
  async getPlans(): Promise<PaystackPlan[]> {
    const response = await apiClient.get<PaystackPlan[]>(
      "/api/v1/subscription/plans",
    );
    return response.data;
  }

  async initializePayment(
    email: string,
    amount: number,
    subTier: string,
  ): Promise<PaystackInitializeResponse> {
    const response = await apiClient.post<PaystackInitializeResponse>(
      "/api/v1/subscription/paystack/initialize",
      { email, amount, sub_tier: subTier },
    );
    return response.data;
  }

  async verifyPayment(reference: string): Promise<{
    message: string;
    data?: Record<string, unknown>;
  }> {
    const response = await apiClient.get<{
      message: string;
      data?: Record<string, unknown>;
    }>(`/api/v1/subscription/paystack/verify?reference=${encodeURIComponent(reference)}`);
    return response.data;
  }

  async cancelSubscription(): Promise<{
    message: string;
    endDate?: string;
  }> {
    const response = await apiClient.post<{
      message: string;
      endDate?: string;
    }>("/api/v1/subscription/cancel");
    return response.data;
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    const response = await apiClient.get<SubscriptionStatusResponse>(
      "/api/v1/subscription/status",
    );
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();
