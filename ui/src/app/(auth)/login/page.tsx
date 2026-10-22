"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, FormError } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login({ email, password });
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your council."
      footer={
        <>
          New to Kakcil?{" "}
          <Link
            href="/register"
            className="text-foreground font-medium hover:underline"
          >
            Create an account
          </Link>
        </>
      }
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <FormError
          message={
            loginError
              ? getErrorMessage(loginError, "Invalid email or password")
              : null
          }
        />
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
