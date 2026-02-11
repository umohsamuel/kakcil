"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Loader2, Mail, CheckCircle2, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPromptPage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendVerification = async () => {
    if (!user?.email) {
      toast.error("Unable to get your email address.");
      return;
    }

    setIsSending(true);
    try {
      await authService.sendVerificationEmail(user.email);
      setIsSent(true);
      toast.success("Verification email sent! Check your inbox.");

      // Start 60s cooldown
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to send verification email.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4 text-sm lg:text-base">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-border bg-background text-foreground border-x-1 border-t-1 border-b-1 shadow-xl drop-shadow-2xl">
          <CardHeader className={"flex flex-col items-center text-center"}>
            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={48}
              height={48}
              className={"invert-100"}
            />
            <CardTitle className="font-mono text-2xl font-bold">
              Verify Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6 py-4">
              {!isSent ? (
                <>
                  <div className="bg-foreground/5 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                    <Mail className="text-foreground/60 h-10 w-10" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-foreground/80 text-sm">
                      Your email address{" "}
                      <span className="text-foreground font-medium">
                        {user?.email}
                      </span>{" "}
                      has not been verified yet.
                    </p>
                    <p className="text-foreground/60 text-sm">
                      Please verify your email to access the dashboard.
                    </p>
                  </div>
                  <Button
                    onClick={handleSendVerification}
                    disabled={isSending}
                    className="bg-foreground text-background hover:bg-foreground/60 h-10 w-full cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold">Email Sent!</h3>
                    <p className="text-foreground/60 text-sm">
                      We&apos;ve sent a verification link to{" "}
                      <span className="text-foreground font-medium">
                        {user?.email}
                      </span>
                      . Please check your inbox and click the link to verify
                      your account.
                    </p>
                  </div>
                  <Button
                    onClick={handleSendVerification}
                    disabled={isSending || cooldown > 0}
                    variant="outline"
                    className="h-10 w-full cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : cooldown > 0 ? (
                      `Resend in ${cooldown}s`
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-border flex justify-center border-t pt-6">
            <Button
              onClick={() => logout()}
              variant="ghost"
              className="text-foreground/60 hover:text-foreground cursor-pointer text-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
