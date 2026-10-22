"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydrate";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 8;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function useScrolled() {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false
  );
}

export function AuthActions({ size = "default" }: { size?: "default" | "lg" }) {
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useHydration();

  if (isHydrated && isAuthenticated) {
    return (
      <Button asChild size={size}>
        <Link href="/chat">Open Kakcil</Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size={size}
        className="hidden sm:inline-flex"
      >
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild size={size}>
        <Link href="/register">Get started</Link>
      </Button>
    </>
  );
}

export function LandingNav() {
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-background/80 border-border backdrop-blur"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />
        <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
