import type { CSSProperties, ReactNode } from "react";
import { Check, Crown, GitBranch, KeyRound, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function Frame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-background bg-dots relative flex h-40 items-center justify-center overflow-hidden rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CanvasVisual() {
  return (
    <Frame>
      <svg
        viewBox="0 0 320 140"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {[70, 160, 250].map((x) => (
          <path
            key={`a-${x}`}
            d={`M160 34 V52 H${x} V66`}
            className="feature-flow"
            fill="none"
            stroke="var(--edge)"
            strokeWidth="1.25"
          />
        ))}
        {[70, 160, 250].map((x) => (
          <path
            key={`b-${x}`}
            d={`M${x} 88 V100 H160 V112`}
            className="feature-flow"
            fill="none"
            stroke={x === 160 ? "var(--edge-strong)" : "var(--edge)"}
            strokeWidth="1.25"
          />
        ))}
      </svg>
      <div className="relative grid h-full w-full max-w-xs grid-rows-[auto_1fr_auto] items-center justify-items-center py-4">
        <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-[10px]">
          Your question
        </span>
        <div className="flex gap-3 transition-[gap] duration-500 group-hover:gap-6">
          {["gpt", "claude", "gemini"].map((name, index) => (
            <span
              key={name}
              className={cn(
                "bg-surface shadow-soft rounded-md border px-2 py-1 font-mono text-[9px]",
                index === 1 && "border-foreground"
              )}
            >
              {name}
            </span>
          ))}
        </div>
        <span className="bg-surface border-foreground flex items-center gap-1 rounded-md border-2 px-2.5 py-1 text-[10px] font-semibold">
          <Crown className="size-3" />
          Answer
        </span>
      </div>
    </Frame>
  );
}

export function BranchVisual() {
  return (
    <Frame>
      <svg viewBox="0 0 200 140" className="h-full w-auto" aria-hidden>
        <path
          d="M60 20 V120"
          stroke="var(--edge)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M60 62 C 60 82, 120 70, 140 94"
          pathLength={1}
          className="feature-branch-path"
          stroke="var(--edge-strong)"
          strokeWidth="1.5"
          strokeDasharray="1"
          fill="none"
        />
        <path
          d="M60 38 C 60 50, 110 40, 130 52"
          pathLength={1}
          className="feature-branch-path-hover"
          stroke="var(--edge-strong)"
          strokeWidth="1.5"
          strokeDasharray="1"
          fill="none"
        />
        {[20, 38, 62, 90, 120].map((y) => (
          <circle key={y} cx="60" cy={y} r="5" fill="var(--foreground)" />
        ))}
        <circle
          cx="140"
          cy="94"
          r="6"
          className="feature-pulse"
          fill="var(--foreground)"
        />
        <circle
          cx="130"
          cy="52"
          r="5"
          className="opacity-0 transition-opacity delay-300 duration-300 group-hover:opacity-100"
          fill="var(--foreground)"
        />
      </svg>
      <span className="text-muted-foreground absolute right-4 bottom-3 flex items-center gap-1 font-mono text-[10px]">
        <GitBranch className="size-3" />2 branches
      </span>
    </Frame>
  );
}

const BALLOT = [
  { model: "gpt", votes: 1 },
  { model: "claude", votes: 3, winner: true },
  { model: "gemini", votes: 1 },
];

const BALLOT_OFFSETS = BALLOT.map((_, index) =>
  BALLOT.slice(0, index).reduce((total, entry) => total + entry.votes, 0)
);

export function VotingVisual() {
  return (
    <Frame>
      <div className="flex items-end gap-5">
        {BALLOT.map((entry, entryIndex) => (
          <div key={entry.model} className="flex flex-col items-center gap-2">
            <div className="flex h-16 flex-col-reverse items-center gap-1">
              {Array.from({ length: entry.votes }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "feature-vote size-3.5 rounded-full",
                    entry.winner ? "bg-foreground" : "bg-edge"
                  )}
                  style={
                    {
                      "--vote-delay": `${(BALLOT_OFFSETS[entryIndex]! + index) * 0.35}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <span
              className={cn(
                "bg-surface flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px]",
                entry.winner && "border-foreground"
              )}
            >
              {entry.winner && <Crown className="size-2.5" />}
              {entry.model}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

const KEYS = [
  { provider: "OpenAI", hint: "gioA" },
  { provider: "Anthropic", hint: "zQAA" },
  { provider: "DeepSeek", hint: "7kd2" },
];

export function KeysVisual() {
  return (
    <Frame>
      <div className="flex w-full max-w-sm flex-col gap-2 px-6">
        {KEYS.map((key, index) => (
          <div
            key={key.provider}
            className="bg-surface shadow-soft relative flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-1.5 transition-transform duration-500 group-hover:translate-x-1"
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            <KeyRound className="text-muted-foreground size-3.5" />
            <span className="text-xs font-medium">{key.provider}</span>
            <span className="text-muted-foreground ml-auto font-mono text-[10px]">
              ••••{key.hint}
            </span>
            <Lock className="size-3" />
            <span
              aria-hidden
              className="feature-shimmer pointer-events-none absolute inset-y-0 w-12"
              style={{ animationDelay: `${index * 0.25}s` }}
            />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function StreamingVisual() {
  return (
    <Frame>
      <div className="bg-surface shadow-soft w-full max-w-[13rem] space-y-1.5 rounded-xl border p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[9px]">
          claude-opus-5-5
          <span className="bg-foreground size-1.5 animate-pulse rounded-full" />
        </div>
        {["w-full", "w-11/12", "w-2/3"].map((width, index) => (
          <div key={width} className={cn("relative h-1.5", width)}>
            <span
              className="feature-stream bg-foreground/70 absolute inset-y-0 left-0 rounded-full"
              style={{ animationDelay: `${index * 0.9}s` }}
            />
          </div>
        ))}
      </div>
    </Frame>
  );
}

const MODELS = [
  "opus-5-5",
  "gpt-6.1",
  "argon",
  "grok-4.7",
  "kimi-k3",
  "v4-pro",
];

export function CouncilVisual() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1.5">
        {MODELS.map((model, index) => (
          <span
            key={model}
            className="feature-toggle bg-surface flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px]"
            style={{ animationDelay: `${index * -0.9}s` }}
          >
            <span className="feature-check flex size-2.5 items-center justify-center rounded-sm border">
              <Check className="size-2" />
            </span>
            {model}
          </span>
        ))}
      </div>
    </Frame>
  );
}
