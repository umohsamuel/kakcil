"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";

interface ChatHeaderProps {
  onLogout: () => void;
}

export function ChatHeader({ onLogout }: ChatHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Kakcil Logo" width={24} height={24} />
        <span className="font-bold">KAKCIL</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onLogout}>
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}

