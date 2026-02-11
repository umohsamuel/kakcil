"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ResetState = "form" | "success" | "failed";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<ResetState>(token ? "form" : "failed");
  const [error, setError] = useState(
    token ? "" : "No reset token found in the URL."
  );

  function toggleShowPassword() {
    setShowPassword(!showPassword);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setError("No reset token found.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setState("success");
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      setState("failed");
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.";
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
              {state === "success" ? "Password Reset!" : "Reset Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-foreground/60 text-center text-sm">
                  Enter your new password below.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-foreground/20"
                    />
                    <div
                      onClick={toggleShowPassword}
                      className="absolute top-1/2 right-2 z-10 size-6 -translate-y-1/2 cursor-pointer"
                    >
                      {!showPassword ? (
                        <Eye size={24} />
                      ) : (
                        <EyeOff size={24} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border-foreground/20"
                    />
                    <div
                      onClick={toggleShowPassword}
                      className="absolute top-1/2 right-2 z-10 size-6 -translate-y-1/2 cursor-pointer"
                    >
                      {!showPassword ? (
                        <Eye size={24} />
                      ) : (
                        <EyeOff size={24} />
                      )}
                    </div>
                  </div>
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
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {state === "success" && (
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-foreground/80 text-sm">
                    Your password has been reset successfully. You can now sign
                    in with your new password.
                  </p>
                </div>
              </div>
            )}

            {state === "failed" && (
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-foreground/60 text-sm">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-border flex justify-center border-t pt-6">
            <Button
              asChild
              className={
                state === "success"
                  ? "bg-foreground text-background hover:bg-foreground/60 h-10 w-full cursor-pointer"
                  : ""
              }
              variant={state === "success" ? "default" : "ghost"}
            >
              <Link href="/login">
                {state === "success" ? "Continue to Sign In" : "Back to Sign In"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-dvh items-center justify-center">
          <Loader2 className="text-foreground/60 h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
