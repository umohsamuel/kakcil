"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, FormError, StatusIcon } from "@/components/auth/auth-shell";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const sendReset = useMutation({
    mutationFn: (value: string) => authService.forgotPassword(value),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendReset.mutate(email);
  };

  const backToSignIn = (
    <Link href="/login" className="text-foreground font-medium hover:underline">
      Back to sign in
    </Link>
  );

  if (sendReset.isSuccess) {
    return (
      <AuthShell title="Check your email" footer={backToSignIn}>
        <div className="space-y-5 text-center">
          <StatusIcon>
            <MailCheck className="size-6" />
          </StatusIcon>
          <p className="text-muted-foreground text-sm">
            If an account exists for{" "}
            <span className="text-foreground font-medium">{email}</span>, a
            reset link is on its way. Check your spam folder if it doesn&apos;t
            arrive.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => sendReset.reset()}
          >
            Use a different email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={backToSignIn}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <FormError
          message={sendReset.error ? getErrorMessage(sendReset.error) : null}
        />
        <Button type="submit" className="w-full" disabled={sendReset.isPending}>
          {sendReset.isPending && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
