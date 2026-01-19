"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export function CTAButtonClient() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col justify-center gap-4 pt-8 transition-all duration-150 ease-linear sm:flex-row">
      {isAuthenticated ? (
        <Link href="/chat">
          <Button
            size="lg"
            className="h-16 cursor-pointer gap-2 rounded-full bg-black px-10 text-lg font-bold text-white hover:scale-105 hover:bg-black/90"
          >
            Launch Council <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      ) : (
        <>
          <Link href="/register">
            <Button
              size="lg"
              className="h-16 cursor-pointer gap-2 rounded-full bg-black px-10 text-lg font-bold text-white hover:scale-105 hover:bg-black/90"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="h-16 cursor-pointer rounded-full border-black/20 px-10 text-lg hover:scale-105 hover:bg-black/5"
            >
              Sign In
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
