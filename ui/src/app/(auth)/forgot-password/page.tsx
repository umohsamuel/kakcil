"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await authService.forgotPassword(email);
      setIsSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
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
              {isSent ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-foreground/60 text-center text-sm">
                  Enter your email address and we&apos;ll send you a link to
                  reset your password.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-foreground/20"
                  />
                </div>
                {error && (
                  <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="bg-foreground text-background hover:bg-foreground/60 h-10 w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-foreground/80 text-sm">
                    We&apos;ve sent a password reset link to{" "}
                    <span className="text-foreground font-medium">{email}</span>.
                    Please check your inbox.
                  </p>
                  <p className="text-foreground/60 text-xs">
                    Didn&apos;t receive the email? Check your spam folder or try
                    again.
                  </p>
                </div>
                <Button
                  onClick={() => setIsSent(false)}
                  variant="outline"
                  className="h-10 w-full cursor-pointer"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-border flex justify-center border-t pt-6">
            <Link
              href="/login"
              className="text-foreground/80 flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
