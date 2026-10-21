"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell, StatusIcon } from "@/components/auth/auth-shell";
import { PageLoader } from "@/components/page-loader";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/utils";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");

  const verification = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => authService.verifyEmail(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const verifying = !!token && verification.isPending;
  const failed = !token || verification.isError;
  const message = !token
    ? "This verification link is missing its token."
    : verification.isError
      ? getErrorMessage(verification.error, "The link may have expired.")
      : "Your email is verified. You're ready to go.";

  return (
    <AuthShell
      title={
        verifying
          ? "Verifying your email"
          : failed
            ? "Verification failed"
            : "Email verified"
      }
    >
      <div className="space-y-5 text-center">
        <StatusIcon>
          {verifying ? (
            <Loader2 className="size-6 animate-spin" />
          ) : failed ? (
            <CircleX className="size-6" />
          ) : (
            <CircleCheck className="size-6" />
          )}
        </StatusIcon>
        {!verifying && (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
        <Button asChild className="w-full">
          <Link href="/login">
            {failed ? "Back to sign in" : "Continue to sign in"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
