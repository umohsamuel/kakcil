"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthShell, FormError, StatusIcon } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { PageLoader } from "@/components/page-loader";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/utils";

function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const resetPassword = useMutation({
    mutationFn: (value: string) => authService.resetPassword(token!, value),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    resetPassword.mutate(password);
  };

  if (!token) {
    return (
      <AuthShell title="Link not valid">
        <div className="space-y-5 text-center">
          <StatusIcon>
            <CircleX className="size-6" />
          </StatusIcon>
          <p className="text-muted-foreground text-sm">
            This reset link is missing its token. Request a new one.
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthShell title="Password updated">
        <div className="space-y-5 text-center">
          <StatusIcon>
            <CircleCheck className="size-6" />
          </StatusIcon>
          <p className="text-muted-foreground text-sm">
            You can now sign in with your new password.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Continue to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      footer={
        <Link
          href="/login"
          className="text-foreground font-medium hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <FormError
          message={
            error ||
            (resetPassword.error
              ? getErrorMessage(
                  resetPassword.error,
                  "The link may have expired"
                )
              : null)
          }
        />
        <Button
          type="submit"
          className="w-full"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending && <Loader2 className="animate-spin" />}
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
