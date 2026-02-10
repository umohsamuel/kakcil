"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { subscriptionService } from "@/services/subscription.service";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type VerifyState = "loading" | "success" | "failed";

function VerifyPaystackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const { user } = useAuthStore();

  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setState("failed");
      setMessage("No payment reference found.");
      return;
    }

    setState("loading");
    try {
      const response = await subscriptionService.verifyPayment(reference);
      setState("success");
      setMessage(
        response.message || "Payment verified! Your subscription will be activated shortly.",
      );
    } catch (error: unknown) {
      setState("failed");
      const msg =
        error instanceof Error ? error.message : "Payment verification failed.";
      setMessage(msg);
    }
  }, [reference]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const handleRetry = async () => {
    if (!user?.email) {
      toast.error("Unable to get user email");
      return;
    }

    setIsRetrying(true);
    try {
      // Re-initialize payment (user can try again)
      const response = await subscriptionService.initializePayment(
        user.email,
        0, // backend will use plan amount
        "plus", // default to plus tier for retry
      );
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Failed to retry payment");
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to retry payment";
      toast.error(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md text-center">
        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="text-muted-foreground mx-auto h-16 w-16 animate-spin" />
            <h2 className="text-xl font-semibold">Verifying Payment...</h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we confirm your payment.
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2 text-sm">{message}</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
          </div>
        )}

        {state === "failed" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Failed</h2>
              <p className="text-muted-foreground mt-2 text-sm">{message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Try Again
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/subscription">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pricing
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPaystackPage() {
  return (
    <ProtectedRoute>
      <main className="bg-background text-foreground relative flex flex-1 flex-col overflow-hidden overflow-y-auto lg:h-[calc(100dvh-1.5rem)] lg:rounded-tl-4xl">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          }
        >
          <VerifyPaystackContent />
        </Suspense>
      </main>
    </ProtectedRoute>
  );
}
