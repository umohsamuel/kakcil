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
            className="bg-foreground text-background hover:bg-foreground/70 h-16 cursor-pointer gap-2 rounded-lg px-10 text-lg font-bold hover:shadow-2xl"
          >
            Launch Council <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      ) : (
        <>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/70 h-16 cursor-pointer gap-2 rounded-lg px-10 text-lg font-bold hover:shadow-2xl"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
