"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePointerFrame } from "@/hooks/use-pointer-frame";

const LINKS = [
  {
    title: "Product",
    items: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Walkthrough", href: "#walkthrough" },
      { label: "Features", href: "#features" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Open Kakcil", href: "/chat" },
    ],
  },
];

const WORDMARK = "KAKCIL".split("");

function setFooterPointer(root: HTMLElement, x: number, y: number) {
  root.style.setProperty("--fx", `${x}px`);
  root.style.setProperty("--fy", `${y}px`);
}

export function SiteFooter() {
  const handlePointerMove = usePointerFrame(setFooterPointer);

  return (
    <footer
      onPointerMove={handlePointerMove}
      className="bg-surface-muted sticky bottom-0 isolate z-0 flex h-[92svh] min-h-[34rem] flex-col overflow-hidden [--fx:50%] [--fy:70%]"
    >
      <div className="bg-dots pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="bg-dots-strong pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(320px_circle_at_var(--fx)_var(--fy),black,transparent)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-28 md:px-6 md:pt-36">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-lg space-y-7">
            <p className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              Ask once. Let the council decide.
            </p>
            <Button asChild size="lg" className="group h-12 rounded-full px-6">
              <Link href="/register">
                Start your council
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="flex gap-16">
            {LINKS.map((group) => (
              <div key={group.title} className="space-y-4">
                <p className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
                  {group.title}
                </p>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group relative text-sm font-medium"
                      >
                        {item.label}
                        <span className="bg-foreground absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div
            aria-label="Kakcil"
            className="font-display flex justify-between pt-10 text-[clamp(4.5rem,21.5vw,16.5rem)] leading-[0.78] select-none"
          >
            {WORDMARK.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                aria-hidden
                className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.3,1.4,0.5,1)] hover:-translate-y-[0.12em]"
              >
                {letter}
              </span>
            ))}
          </div>
          <div className="text-muted-foreground flex items-center justify-between border-t py-5 text-xs">
            <span>© {new Date().getFullYear()} Kakcil</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-foreground group inline-flex items-center gap-1.5 transition-colors"
            >
              Back to top
              <ArrowUp className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
