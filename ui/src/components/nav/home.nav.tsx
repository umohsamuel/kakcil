"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export function NavHome() {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="absolute top-0 left-1/2 z-50 container mx-auto flex h-[100px] -translate-x-1/2 items-center justify-between px-4">
      <div className="flex items-center gap-3 font-bold tracking-tighter">
        <Image
          src="/logo.png"
          alt="Kakcil Logo"
          width={32}
          height={32}
          className={"invert-100"}
        />
        <span
          className={
            "text-foreground/70 font-bitcount-grid-double hidden pt-1 text-3xl font-light tracking-wide lg:inline-block"
          }
        >
          KAKCIL
        </span>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link href="/chat">
            <Button className="bg-foreground text-background hover:bg-foreground/70 cursor-pointer rounded-sm px-6 transition-all hover:shadow-xl">
              Open Chat
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-foreground hover:text-foreground/80 cursor-pointer"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-foreground text-background hover:bg-foreground/70 cursor-pointer rounded-sm px-6 font-semibold transition-all hover:shadow-xl">
                Get Started
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
