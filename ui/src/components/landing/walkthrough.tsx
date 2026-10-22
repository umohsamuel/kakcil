"use client";

import {
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowUp, Crown, GitBranch, MousePointer2, Plus } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const SECTION_ID = "walkthrough";

const STEPS = [
  {
    title: "Type your question",
    body: "One prompt goes to every model on your council at the same time.",
  },
  {
    title: "Watch them think",
    body: "Each answer streams into its own node, side by side on the canvas.",
  },
  {
    title: "See the verdict",
    body: "The models score each other. The winner becomes the council answer.",
  },
  {
    title: "Fork the conversation",
    body: "Branch from any response, even one that lost the vote, and keep going.",
  },
];

const CAMERA = [
  "translate(6%, 2%) scale(1.08)",
  "translate(9%, 8%) scale(1.12)",
  "translate(8%, -2%) scale(1.08)",
  "translate(-14%, -6%) scale(1.08)",
];

type Box = { x: number; y: number; w: number; h: number };

const STAGE = { w: 1000, h: 600 };
const PROMPT: Box = { x: 265, y: 40, w: 240, h: 62 };
const RESPONSES: (Box & { model: string; lines: string[]; at: number })[] = [
  {
    x: 80,
    y: 170,
    w: 190,
    h: 104,
    model: "gpt-6.1-sol",
    lines: ["Go: simple syntax,", "fast builds, great", "for services."],
    at: 0.2,
  },
  {
    x: 290,
    y: 170,
    w: 190,
    h: 104,
    model: "claude-opus-5-5",
    lines: ["Depends on the goal.", "Go to ship fast,", "Rust for control."],
    at: 0.4,
  },
  {
    x: 500,
    y: 170,
    w: 190,
    h: 104,
    model: "gemini-4-argon",
    lines: ["Rust gives memory", "safety without a", "garbage collector."],
    at: 0.6,
  },
];
const ANSWER: Box = { x: 265, y: 350, w: 240, h: 88 };
const BRANCH_PROMPT: Box = { x: 735, y: 300, w: 220, h: 62 };
const BRANCH_ANSWER: Box = { x: 735, y: 430, w: 220, h: 76 };

const pct = (value: number, total: number) => `${(value / total) * 100}%`;
const centerX = (box: Box) => box.x + box.w / 2;

const delay = (at: number, duration?: number): CSSProperties => ({
  animationDelay: `${at}s`,
  ...(duration ? { animationDuration: `${duration}s` } : {}),
});

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function readStep() {
  const section = document.getElementById(SECTION_ID);
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const travel = rect.height - window.innerHeight;
  if (travel <= 0) return 0;
  const progress = Math.min(1, Math.max(0, -rect.top / travel));
  return Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
}

function scrollToStep(index: number) {
  const section = document.getElementById(SECTION_ID);
  if (!section) return;
  const travel = section.offsetHeight - window.innerHeight;
  window.scrollTo({
    top: section.offsetTop + (travel * (index + 0.5)) / STEPS.length,
    behavior: "smooth",
  });
}

function Node({
  box,
  at,
  className,
  children,
}: {
  box: Box;
  at: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "demo-in absolute rounded-[0.9em] px-[1em] py-[0.8em]",
        className
      )}
      style={{
        left: pct(box.x, STAGE.w),
        top: pct(box.y, STAGE.h),
        width: pct(box.w, STAGE.w),
        animationDelay: `${at}s`,
      }}
    >
      {children}
    </div>
  );
}

function Edge({ d, at, dashed }: { d: string; at: number; dashed?: boolean }) {
  return (
    <path
      d={d}
      pathLength={1}
      className={dashed ? "demo-fade" : "demo-draw"}
      style={delay(at)}
      fill="none"
      stroke={dashed ? "var(--edge-strong)" : "var(--edge)"}
      strokeWidth={dashed ? 1.5 : 1.25}
      strokeDasharray={dashed ? "6 5" : undefined}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Stage({ step }: { step: number }) {
  const promptBottom = PROMPT.y + PROMPT.h;
  const branchSource = RESPONSES[2]!;

  return (
    <div
      className="absolute inset-0 [font-size:clamp(5.5px,1.5cqw,15px)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
      style={{ transform: CAMERA[step] }}
    >
      <svg
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        {step >= 1 &&
          RESPONSES.map((response) => (
            <Edge
              key={`ask-${response.model}`}
              at={0}
              d={`M${centerX(PROMPT)} ${promptBottom} V${promptBottom + 34} H${centerX(response)} V${response.y}`}
            />
          ))}
        {step >= 2 &&
          RESPONSES.map((response) => (
            <Edge
              key={`vote-${response.model}`}
              at={0.9}
              d={`M${centerX(response)} ${response.y + response.h} V${ANSWER.y - 34} H${centerX(ANSWER)} V${ANSWER.y}`}
            />
          ))}
        {step >= 3 && (
          <>
            <Edge
              dashed
              at={3}
              d={`M${branchSource.x + branchSource.w} ${branchSource.y + 52} H${BRANCH_PROMPT.x - 22} V${BRANCH_PROMPT.y + 31} H${BRANCH_PROMPT.x}`}
            />
            <Edge
              at={3.6}
              d={`M${centerX(BRANCH_PROMPT)} ${BRANCH_PROMPT.y + BRANCH_PROMPT.h} V${BRANCH_ANSWER.y}`}
            />
          </>
        )}
      </svg>

      <Node
        key={step === 0 ? "prompt-ask" : "prompt"}
        box={PROMPT}
        at={step === 0 ? 1.6 : 0}
        className="bg-primary text-primary-foreground shadow-soft"
      >
        <div className="mb-[0.35em] font-mono text-[0.7em] tracking-widest uppercase opacity-60">
          You
        </div>
        <div className="text-[0.95em]">Rust or Go for backend work?</div>
      </Node>

      {step >= 1 &&
        RESPONSES.map((response, index) => (
          <Node
            key={response.model}
            box={response}
            at={response.at}
            className={cn(
              "bg-surface shadow-soft border",
              step >= 2 && index === 1 && "demo-winner",
              step >= 3 && index === 2 && "demo-branch-ring"
            )}
          >
            <div className="mb-[0.5em] flex items-center justify-between gap-[0.5em]">
              <span className="truncate font-mono text-[0.75em] font-medium">
                {response.model}
              </span>
              {step >= 2 && index === 1 && (
                <span
                  className="demo-pop bg-primary text-primary-foreground flex items-center gap-[0.25em] rounded-full px-[0.45em] py-[0.1em] font-mono text-[0.6em] uppercase"
                  style={delay(1)}
                >
                  <Crown className="size-[1.1em]" />
                  Best
                </span>
              )}
            </div>
            {response.lines.map((line, lineIndex) => (
              <div
                key={line}
                className="demo-type text-muted-foreground text-[0.8em] leading-[1.5]"
                style={delay(response.at + 0.4 + lineIndex * 0.5, 0.5)}
              >
                {line}
              </div>
            ))}
            {step >= 2 && (
              <div
                className="demo-fade text-muted-foreground mt-[0.4em] font-mono text-[0.65em]"
                style={delay(1)}
              >
                {index === 1 ? "2 votes" : index === 0 ? "1 vote" : "0 votes"}
              </div>
            )}
          </Node>
        ))}

      {step >= 2 && (
        <>
          <div
            className="demo-blink text-muted-foreground absolute font-mono text-[0.7em] uppercase"
            style={{
              left: pct(ANSWER.x, STAGE.w),
              top: pct(ANSWER.y - 24, STAGE.h),
              ...delay(0, 1.1),
            }}
          >
            Council voting…
          </div>
          <Node
            box={ANSWER}
            at={1.2}
            className="bg-surface shadow-float border-foreground border-2"
          >
            <div className="mb-[0.45em] flex items-center gap-[0.35em] text-[0.8em] font-semibold">
              <Crown className="size-[1.1em]" />
              Council answer
            </div>
            <div
              className="demo-type text-[0.8em] leading-[1.5]"
              style={delay(1.5, 0.7)}
            >
              Pick Go to ship services fast;
            </div>
            <div
              className="demo-type text-[0.8em] leading-[1.5]"
              style={delay(2.1, 0.7)}
            >
              pick Rust for tight control.
            </div>
          </Node>
        </>
      )}

      {step >= 3 && (
        <>
          <div
            className="demo-blink bg-surface shadow-float absolute flex items-center gap-[0.4em] rounded-[0.6em] border px-[0.7em] py-[0.45em] font-mono text-[0.7em]"
            style={{
              left: pct(branchSource.x + 70, STAGE.w),
              top: pct(branchSource.y + branchSource.h + 6, STAGE.h),
              ...delay(0.85, 0.8),
            }}
          >
            <GitBranch className="size-[1.1em]" />
            Branch from here
          </div>
          <Node
            box={BRANCH_PROMPT}
            at={3.1}
            className="bg-primary text-primary-foreground shadow-soft"
          >
            <div className="mb-[0.35em] flex items-center gap-[0.35em] font-mono text-[0.7em] tracking-widest uppercase opacity-60">
              <GitBranch className="size-[1.1em]" />
              Branch
            </div>
            <div className="text-[0.9em]">Show me a Rust example</div>
          </Node>
          <Node
            box={BRANCH_ANSWER}
            at={3.8}
            className="bg-surface shadow-float border-foreground border-2"
          >
            <div className="mb-[0.4em] flex items-center gap-[0.35em] text-[0.75em] font-semibold">
              <Crown className="size-[1.1em]" />
              Council answer
            </div>
            <div
              className="demo-type font-mono text-[0.75em]"
              style={delay(4.1, 0.8)}
            >
              fn main() {"{ … }"}
            </div>
          </Node>
        </>
      )}

      <div className="absolute inset-x-[12%] bottom-[4%]">
        <div className="bg-surface shadow-float overflow-hidden rounded-[1em] border">
          {step >= 3 && (
            <div
              className="demo-chip text-muted-foreground flex items-center gap-[0.4em] border-b px-[0.9em] py-[0.45em] text-[0.7em]"
              style={delay(1.6)}
            >
              <GitBranch className="size-[1.1em]" />
              Branching from gemini-4-argon
            </div>
          )}
          <div className="flex items-center gap-[0.6em] px-[0.9em] py-[0.6em]">
            <div className="relative h-[1.5em] flex-1 text-[0.85em]">
              {step === 0 && (
                <span
                  className="demo-typed-a absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                  style={delay(0.3, 1.5)}
                >
                  Rust or Go for backend work?
                </span>
              )}
              {step === 3 && (
                <span
                  className="demo-typed-b absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                  style={delay(1.9, 1.1)}
                >
                  Show me a Rust example
                </span>
              )}
              <span
                key={step}
                className="demo-fade text-muted-foreground absolute inset-y-0 left-0"
                style={delay(step === 0 ? 1.8 : step === 3 ? 3 : 0)}
              >
                Ask the council…
              </span>
            </div>
            <span className="bg-primary text-primary-foreground flex size-[2em] items-center justify-center rounded-[0.6em]">
              <ArrowUp className="size-[1em]" />
            </span>
          </div>
        </div>
      </div>

      {step === 0 && (
        <MousePointer2
          aria-hidden
          className="walk-cursor-ask fill-foreground text-background absolute size-[1.8em] drop-shadow-md"
        />
      )}
      {step === 3 && (
        <MousePointer2
          aria-hidden
          className="walk-cursor-branch fill-foreground text-background absolute size-[1.8em] drop-shadow-md"
        />
      )}
    </div>
  );
}

export function Walkthrough() {
  const step = useSyncExternalStore(subscribe, readStep, () => 0);

  return (
    <section
      id={SECTION_ID}
      aria-label="Product walkthrough"
      className="relative h-[420svh]"
    >
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 md:px-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2.4fr)] lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                Walkthrough
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                One question, start to finish
              </h2>
            </div>
            <ol className="relative hidden space-y-1 lg:block">
              <div
                aria-hidden
                className="bg-border absolute top-2 bottom-2 left-[7px] w-px"
              />
              <div
                aria-hidden
                className="bg-foreground absolute top-2 left-[7px] w-px transition-[height] duration-700 ease-out"
                style={{
                  height: `calc(${(step / (STEPS.length - 1)) * 100}% - 1rem)`,
                }}
              />
              {STEPS.map((item, index) => (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => scrollToStep(index)}
                    className="group relative flex w-full gap-4 rounded-xl py-3 pr-3 text-left"
                  >
                    <span
                      className={cn(
                        "relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-2 transition-colors duration-500",
                        index <= step
                          ? "border-foreground bg-foreground"
                          : "border-border-strong bg-background group-hover:border-foreground"
                      )}
                    />
                    <span className="space-y-1">
                      <span
                        className={cn(
                          "block font-medium transition-colors duration-500",
                          index === step
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "text-muted-foreground grid text-sm leading-relaxed transition-[grid-template-rows,opacity] duration-500",
                          index === step
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <span className="overflow-hidden">{item.body}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="space-y-1 lg:hidden">
              <p className="font-medium">
                <span className="text-muted-foreground mr-2 font-mono text-xs">
                  0{step + 1}
                </span>
                {STEPS[step]!.title}
              </p>
              <p className="text-muted-foreground text-sm">
                {STEPS[step]!.body}
              </p>
            </div>
          </div>

          <div className="bg-surface shadow-float overflow-hidden rounded-[1.25rem] border">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <span className="bg-border-strong size-2.5 rounded-full" />
              <span className="bg-border-strong size-2.5 rounded-full" />
              <span className="bg-border-strong size-2.5 rounded-full" />
              <span className="text-muted-foreground bg-muted mx-auto rounded-md px-3 py-0.5 font-mono text-[11px]">
                kakcil.app/chat
              </span>
            </div>
            <div className="flex">
              <aside className="bg-sidebar hidden w-[18%] shrink-0 flex-col gap-3 border-r p-3 md:flex">
                <div className="flex items-center gap-2 px-1">
                  <LogoMark size={16} />
                  <span className="font-display text-sm leading-none">
                    KAKCIL
                  </span>
                </div>
                <div className="bg-surface flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px]">
                  <Plus className="size-3" />
                  New chat
                </div>
                <div className="text-muted-foreground px-1 text-[10px]">
                  Today
                </div>
                <div
                  className={cn(
                    "bg-muted truncate rounded-md px-2 py-1 text-[11px] transition-opacity duration-500",
                    step === 0 && "opacity-0"
                  )}
                >
                  Rust or Go for backend
                </div>
                {["Explain the CAP theorem", "Pricing page copy ideas"].map(
                  (chat) => (
                    <div
                      key={chat}
                      className="text-muted-foreground truncate rounded-md px-2 py-1 text-[11px]"
                    >
                      {chat}
                    </div>
                  )
                )}
              </aside>
              <div className="bg-canvas bg-dots [container-type:inline-size] relative aspect-[5/3] min-w-0 flex-1 overflow-hidden">
                <Stage step={step} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
