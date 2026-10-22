"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Crown, GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydrate";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "DeepSeek",
  "xAI",
  "Moonshot",
];

const FLOATERS: {
  className: string;
  depth: number;
  duration: number;
  content: React.ReactNode;
}[] = [
  {
    className: "left-[6%] top-[22%]",
    depth: 18,
    duration: 7,
    content: (
      <>
        <div className="mb-1.5 flex items-center justify-between gap-6 font-mono text-[10px]">
          claude-opus-5-5
          <Loader2 className="text-muted-foreground size-3 animate-spin" />
        </div>
        <div className="bg-muted h-1.5 w-32 rounded-full" />
        <div className="bg-muted mt-1 h-1.5 w-24 rounded-full" />
      </>
    ),
  },
  {
    className: "right-[7%] top-[18%]",
    depth: 26,
    duration: 8,
    content: (
      <div className="flex items-center gap-2 text-xs font-medium">
        <Crown className="size-3.5" />
        Council answer
        <span className="text-muted-foreground font-mono text-[10px]">
          3 votes
        </span>
      </div>
    ),
  },
  {
    className: "left-[10%] bottom-[24%]",
    depth: 32,
    duration: 9,
    content: (
      <div className="font-mono text-[10px]">
        gpt-6.1-sol
        <span className="text-muted-foreground ml-3">2 votes</span>
      </div>
    ),
  },
  {
    className: "right-[9%] bottom-[28%]",
    depth: 20,
    duration: 7.5,
    content: (
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
        <GitBranch className="size-3" />
        Branch from here
      </div>
    ),
  },
];

const LINE_ONE = ["Ask", "once."];
const LINE_TWO = ["Let", "the", "council", "decide."];

function Word({ word, index }: { word: string; index: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span
        className="hero-word relative inline-block"
        style={{ animationDelay: `${0.12 + index * 0.09}s` }}
      >
        {word}
        {word === "council" && (
          <svg
            aria-hidden
            viewBox="0 0 300 20"
            preserveAspectRatio="none"
            className="absolute -bottom-[0.02em] left-0 h-[0.14em] w-full overflow-visible"
          >
            <path
              d="M3 13 C 70 4, 150 4, 297 11"
              pathLength={1}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="hero-underline"
            />
          </svg>
        )}
      </span>
    </span>
  );
}

function PrimaryAction() {
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useHydration();
  const signedIn = isHydrated && isAuthenticated;

  return (
    <Button
      asChild
      size="lg"
      className="group h-12 rounded-full px-6 text-base"
    >
      <Link href={signedIn ? "/chat" : "/register"}>
        {signedIn ? "Open Kakcil" : "Start your council"}
        <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    root.style.setProperty("--mx", `${x}px`);
    root.style.setProperty("--my", `${y}px`);
    root.style.setProperty("--px", `${(x / rect.width) * 2 - 1}`);
    root.style.setProperty("--py", `${(y / rect.height) * 2 - 1}`);
  };

  return (
    <section
      ref={rootRef}
      onPointerMove={handlePointerMove}
      className="relative isolate flex min-h-svh flex-col overflow-hidden [--mx:50%] [--my:40%] [--px:0] [--py:0]"
    >
      <div className="bg-dots pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_70%)] opacity-60" />
      <div className="bg-dots-strong pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(280px_circle_at_var(--mx)_var(--my),black,transparent)]" />

      {FLOATERS.map((floater, index) => (
        <div
          key={index}
          aria-hidden
          className={cn(
            "pointer-events-none absolute hidden lg:block",
            floater.className
          )}
          style={
            {
              transform: `translate3d(calc(var(--px) * ${floater.depth}px), calc(var(--py) * ${floater.depth}px), 0)`,
              transition: "transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)",
            } as CSSProperties
          }
        >
          <div
            className="hero-float bg-surface/90 shadow-float rounded-xl border px-3.5 py-2.5 backdrop-blur"
            style={{
              animationDuration: `0.8s, ${floater.duration}s`,
              animationDelay: `${0.9 + index * 0.15}s, ${index * -1.3}s`,
            }}
          >
            {floater.content}
          </div>
        </div>
      ))}

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 pt-24 pb-10 text-center md:px-6">
        <h1 className="text-[clamp(2.75rem,8vw,7.25rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
          <span className="block">
            {LINE_ONE.map((word, index) => (
              <span key={word}>
                <Word word={word} index={index} />
                {index < LINE_ONE.length - 1 && " "}
              </span>
            ))}
          </span>
          <span className="block">
            {LINE_TWO.map((word, index) => (
              <span key={word}>
                <Word word={word} index={LINE_ONE.length + index} />
                {index < LINE_TWO.length - 1 && " "}
              </span>
            ))}
          </span>
        </h1>

        <p
          className="hero-rise text-muted-foreground mt-8 max-w-xl text-base text-balance md:text-lg"
          style={{ animationDelay: "0.75s" }}
        >
          Every model you trust answers at once. They vote on each other, and
          you get the answer they agree on.
        </p>

        <div
          className="hero-rise mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.9s" }}
        >
          <PrimaryAction />
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="group h-12 rounded-full px-6 text-base"
          >
            <a href="#walkthrough">
              Watch it work
              <ArrowDown className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </Button>
        </div>
      </div>

      <div
        className="hero-rise relative pb-8"
        style={{ animationDelay: "1.1s" }}
      >
        <p className="text-muted-foreground mb-4 text-center text-xs">
          Bring your own keys
        </p>
        <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 md:gap-x-12">
          {PROVIDERS.map((provider) => (
            <li
              key={provider}
              className="text-muted-foreground/70 hover:text-foreground cursor-default text-base font-semibold tracking-tight transition-colors duration-300 md:text-lg"
            >
              {provider}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
