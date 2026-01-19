"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";


export function NavHome() {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="flex items-center justify-between absolute top-0 left-1/2 -translate-x-1/2 h-[100px] container mx-auto z-50">
      <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter">
        <Image src="/logo.png" alt="Kakcil Logo" width={32} height={32} className={'invert-100'} />
        <span className={'hidden lg:inline-block font-mono tracking-wide'}>KAKCIL</span>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link href="/chat">
            <Button className="rounded-full px-6 bg-black text-white hover:bg-black/90 transition-all hover:scale-105">
              Open Chat
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="text-black hover:text-black/80">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full px-6 bg-black text-white hover:bg-black/90 font-semibold transition-all hover:scale-105">
                Get Started
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
