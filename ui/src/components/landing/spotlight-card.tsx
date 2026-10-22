"use client";

import type { ReactNode } from "react";
import { usePointerFrame } from "@/hooks/use-pointer-frame";
import { cn } from "@/lib/utils";

function setSpotlightPointer(card: HTMLDivElement, x: number, y: number) {
  card.style.setProperty("--x", `${x}px`);
  card.style.setProperty("--y", `${y}px`);
}

export function SpotlightCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const handlePointerMove = usePointerFrame(setSpotlightPointer);

  return (
    <div
      onPointerMove={handlePointerMove}
      className={cn(
        "group bg-surface-muted relative isolate overflow-hidden rounded-3xl p-7 transition-transform duration-500 ease-out hover:-translate-y-1",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), color-mix(in srgb, var(--foreground) 7%, transparent), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
