"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, loginError } = useAuth();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("login details,", { email }, { password });
    login(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Welcome back!");
        },
        onError: () => {
          toast.error("Invalid email or password");
        },
      }
    );
  };
  return (
    <div className="bg-brand-white flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-border bg-brand-white text-brand-black border-x-1 border-t-1 border-b-1 shadow-xl drop-shadow-2xl">
          <CardHeader className={"flex flex-col items-center text-center"}>
            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={48}
              height={48}
              className={"invert-100"}
            />
            <CardTitle className="font-mono text-2xl font-bold">
              Welcome back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              {loginError && (
                <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
                  {loginError.message}
                </div>
              )}
              <Button
                type="submit"
                className="bg-brand-black text-brand-white hover:bg-brand-black/60 h-10 w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-border flex justify-center border-t pt-6">
            <p className="text-brand-black/80 text-sm">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
