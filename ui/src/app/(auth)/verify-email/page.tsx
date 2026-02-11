"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type VerifyState = "loading" | "success" | "failed";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setState("failed");
      setMessage("No verification token found in the URL.");
      return;
    }

    setState("loading");
    try {
      await authService.verifyEmail(token);
      setState("success");
      setMessage("Your email has been verified successfully!");
    } catch (error: unknown) {
      setState("failed");
      const msg =
        error instanceof Error
          ? error.message
          : "Email verification failed. The link may have expired.";
      setMessage(msg);
    }
  }, [token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

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
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6 py-4">
              {state === "loading" && (
                <div className="space-y-4 text-center">
                  <Loader2 className="text-foreground/60 mx-auto h-16 w-16 animate-spin" />
                  <p className="text-foreground/60 text-sm">
                    Verifying your email address...
                  </p>
                </div>
              )}

              {state === "success" && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Email Verified!
                    </h3>
                    <p className="text-foreground/60 mt-2 text-sm">
                      {message}
                    </p>
                  </div>
                </div>
              )}

              {state === "failed" && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Verification Failed
                    </h3>
                    <p className="text-foreground/60 mt-2 text-sm">
                      {message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-border flex justify-center border-t pt-6">
            <Button
              asChild
              className="bg-foreground text-background hover:bg-foreground/60 h-10 w-full cursor-pointer"
            >
              <Link href="/login">
                {state === "success" ? "Continue to Login" : "Back to Login"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-dvh items-center justify-center">
          <Loader2 className="text-foreground/60 h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
