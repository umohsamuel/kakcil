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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register, isRegistering, registerError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

    register(
      { name, email, password },
      {
        onSuccess: () => {
          toast.success("Account created! Please log in.");
        },
        onError: () => {
          toast.error("Registration failed. Please try again.");
        },
      }
    );
  };

  function toggleShowPassword() {
    setShowPassword(!showPassword);
  }

  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4 text-sm lg:text-base">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-background text-foreground border-border shadow-xl drop-shadow-2xl">
          <CardHeader className={"flex flex-col items-center text-center"}>
            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={48}
              height={48}
              className={"invert-100"}
            />
            <CardTitle className="font-mono text-2xl font-bold">
              Welcome to Kakcil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-foreground/20"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    {!showPassword ? <Eye size={24} /> : <EyeOff size={24} />}
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
                    {!showPassword ? <Eye size={24} /> : <EyeOff size={24} />}
                  </div>
                </div>
              </div>
              {(error || registerError) && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error || registerError?.message}
                </div>
              )}
              <Button
                type="submit"
                className="bg-foreground hover:bg-foreground/90 text-background h-10 w-full cursor-pointer"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-foreground/80 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
