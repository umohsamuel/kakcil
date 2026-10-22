"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogOut, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell, FormError, StatusIcon } from "@/components/auth/auth-shell";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/utils";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPromptPage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    },
    []
  );

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setCooldown((value) => {
        if (value <= 1 && intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return Math.max(0, value - 1);
      });
    }, 1000);
  };

  const sendVerification = useMutation({
    mutationFn: () => authService.sendVerificationEmail(user?.email ?? ""),
    onSuccess: startCooldown,
  });

  const sent = sendVerification.isSuccess;

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Verify your email"}
      footer={
        <button
          type="button"
          onClick={() => logout()}
          className="hover:text-foreground inline-flex items-center gap-1.5"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      }
    >
      <div className="space-y-5 text-center">
        <StatusIcon>
          {sent ? (
            <MailCheck className="size-6" />
          ) : (
            <Mail className="size-6" />
          )}
        </StatusIcon>
        <p className="text-muted-foreground text-sm">
          {sent ? "We sent a verification link to " : "Confirm "}
          <span className="text-foreground font-medium">{user?.email}</span>
          {sent
            ? ". Open it to activate your account."
            : " to start using Kakcil."}
        </p>
        <FormError
          message={
            sendVerification.error
              ? getErrorMessage(sendVerification.error)
              : null
          }
        />
        <Button
          className="w-full"
          variant={sent ? "outline" : "default"}
          disabled={sendVerification.isPending || cooldown > 0 || !user?.email}
          onClick={() => sendVerification.mutate()}
        >
          {sendVerification.isPending && <Loader2 className="animate-spin" />}
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : sent
              ? "Resend email"
              : "Send verification email"}
        </Button>
      </div>
    </AuthShell>
  );
}
