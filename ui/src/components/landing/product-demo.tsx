"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Crown,
  GitBranch,
  MousePointer2,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const CYCLE_SECONDS = 15;

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
    at: 1.6,
  },
  {
    x: 290,
    y: 170,
    w: 190,
    h: 104,
    model: "claude-opus-5-5",
    lines: ["Depends on the goal.", "Go to ship fast,", "Rust for control."],
    at: 1.9,
  },
  {
    x: 500,
    y: 170,
    w: 190,
    h: 104,
    model: "gemini-4-argon",
    lines: ["Rust gives memory", "safety without a", "garbage collector."],
    at: 2.2,
  },
];
const ANSWER: Box = { x: 265, y: 350, w: 240, h: 88 };
const BRANCH_PROMPT: Box = { x: 735, y: 300, w: 220, h: 62 };
const BRANCH_ANSWER: Box = { x: 735, y: 430, w: 220, h: 76 };

const CHAPTERS = [
  { label: "Ask once", start: 0, end: 13 },
  { label: "Every model answers", start: 13, end: 33 },
  { label: "The council votes", start: 33, end: 50 },
  { label: "Branch from any answer", start: 50, end: 100 },
];

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const boxStyle = (box: Box, at: number): CSSProperties => ({
  left: pct(box.x, STAGE.w),
  top: pct(box.y, STAGE.h),
  width: pct(box.w, STAGE.w),
  animationDelay: `${at}s`,
});

const delay = (at: number, duration?: number): CSSProperties => ({
  animationDelay: `${at}s`,
  ...(duration ? { animationDuration: `${duration}s` } : {}),
});

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
      style={boxStyle(box, at)}
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
      className={cn(dashed ? "demo-fade" : "demo-draw")}
      style={delay(at)}
      fill="none"
      stroke={dashed ? "var(--edge-strong)" : "var(--edge)"}
      strokeWidth={dashed ? 1.5 : 1.25}
      strokeDasharray={dashed ? "6 5" : undefined}
      vectorEffect="non-scaling-stroke"
    />
  );
}

const centerX = (box: Box) => box.x + box.w / 2;

function DemoStage() {
  const promptBottom = PROMPT.y + PROMPT.h;
  const branchSource = RESPONSES[2]!;

  return (
    <div className="demo-camera absolute inset-0 [font-size:clamp(5px,1.35cqw,13px)]">
      <svg
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        {RESPONSES.map((response) => (
          <Edge
            key={`ask-${response.model}`}
            at={1.2}
            d={`M${centerX(PROMPT)} ${promptBottom} V${promptBottom + 34} H${centerX(response)} V${response.y}`}
          />
        ))}
        {RESPONSES.map((response) => (
          <Edge
            key={`vote-${response.model}`}
            at={5.2}
            d={`M${centerX(response)} ${response.y + response.h} V${ANSWER.y - 34} H${centerX(ANSWER)} V${ANSWER.y}`}
          />
        ))}
        <Edge
          dashed
          at={9.4}
          d={`M${branchSource.x + branchSource.w} ${branchSource.y + 52} H${BRANCH_PROMPT.x - 22} V${BRANCH_PROMPT.y + 31} H${BRANCH_PROMPT.x}`}
        />
        <Edge
          at={10.6}
          d={`M${centerX(BRANCH_PROMPT)} ${BRANCH_PROMPT.y + BRANCH_PROMPT.h} V${BRANCH_ANSWER.y}`}
        />
      </svg>

      <Node
        box={PROMPT}
        at={1}
        className="bg-primary text-primary-foreground shadow-soft"
      >
        <div className="mb-[0.35em] font-mono text-[0.7em] tracking-widest uppercase opacity-60">
          You
        </div>
        <div className="text-[0.95em]">Rust or Go for backend work?</div>
      </Node>

      {RESPONSES.map((response, index) => (
        <Node
          key={response.model}
          box={response}
          at={response.at}
          className={cn(
            "bg-surface shadow-soft border",
            index === 1 && "demo-winner",
            index === 2 && "demo-branch-source"
          )}
        >
          <div className="mb-[0.5em] flex items-center justify-between gap-[0.5em]">
            <span className="truncate font-mono text-[0.75em] font-medium">
              {response.model}
            </span>
            {index === 1 && (
              <span
                className="demo-pop bg-primary text-primary-foreground flex items-center gap-[0.25em] rounded-full px-[0.45em] py-[0.1em] font-mono text-[0.6em] uppercase"
                style={delay(5.6)}
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
              style={delay(response.at + 0.5 + lineIndex * 0.7, 0.7)}
            >
              {line}
            </div>
          ))}
          <div
            className="demo-fade text-muted-foreground mt-[0.4em] font-mono text-[0.65em]"
            style={delay(5.6)}
          >
            {index === 1 ? "2 votes" : index === 0 ? "1 vote" : "0 votes"}
          </div>
        </Node>
      ))}

      <div
        className="demo-menu bg-surface shadow-float absolute flex items-center gap-[0.4em] rounded-[0.6em] border px-[0.7em] py-[0.45em] font-mono text-[0.7em]"
        style={{
          left: pct(branchSource.x + 70, STAGE.w),
          top: pct(branchSource.y + branchSource.h + 6, STAGE.h),
        }}
      >
        <GitBranch className="size-[1.1em]" />
        Branch from here
      </div>

      <div
        className="demo-blink text-muted-foreground absolute font-mono text-[0.7em] uppercase"
        style={{
          left: pct(ANSWER.x, STAGE.w),
          top: pct(ANSWER.y - 24, STAGE.h),
          ...delay(4.4),
        }}
      >
        Council voting…
      </div>

      <Node
        box={ANSWER}
        at={6.2}
        className="bg-surface shadow-float border-foreground border-2"
      >
        <div className="mb-[0.45em] flex items-center gap-[0.35em] text-[0.8em] font-semibold">
          <Crown className="size-[1.1em]" />
          Council answer
        </div>
        <div
          className="demo-type text-[0.8em] leading-[1.5]"
          style={delay(6.6, 0.8)}
        >
          Pick Go to ship services fast;
        </div>
        <div
          className="demo-type text-[0.8em] leading-[1.5]"
          style={delay(7.3, 0.8)}
        >
          pick Rust for tight control.
        </div>
      </Node>

      <Node
        box={BRANCH_PROMPT}
        at={9.8}
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
        at={11.2}
        className="bg-surface shadow-float border-foreground border-2"
      >
        <div className="mb-[0.4em] flex items-center gap-[0.35em] text-[0.75em] font-semibold">
          <Crown className="size-[1.1em]" />
          Council answer
        </div>
        <div
          className="demo-type font-mono text-[0.75em]"
          style={delay(11.6, 1)}
        >
          fn main() {"{ … }"}
        </div>
      </Node>

      <div className="absolute inset-x-[12%] bottom-[4%]">
        <div className="bg-surface shadow-float overflow-hidden rounded-[1em] border">
          <div
            className="demo-chip text-muted-foreground flex items-center gap-[0.4em] border-b px-[0.9em] py-[0.45em] text-[0.7em]"
            style={delay(8.2)}
          >
            <GitBranch className="size-[1.1em]" />
            Branching from gemini-4-argon
          </div>
          <div className="flex items-center gap-[0.6em] px-[0.9em] py-[0.6em]">
            <div className="relative h-[1.5em] flex-1 text-[0.85em]">
              <span className="demo-typed-a absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap">
                Rust or Go for backend work?
              </span>
              <span
                className="demo-typed-b absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                style={delay(8.6, 1)}
              >
                Show me a Rust example
              </span>
              <span className="demo-placeholder text-muted-foreground absolute inset-y-0 left-0">
                Ask the council…
              </span>
            </div>
            <span className="bg-primary text-primary-foreground flex size-[2em] items-center justify-center rounded-[0.6em]">
              <ArrowUp className="size-[1em]" />
            </span>
          </div>
        </div>
      </div>

      <MousePointer2
        aria-hidden
        className="demo-cursor fill-foreground text-background absolute size-[1.8em] drop-shadow-md"
      />
    </div>
  );
}

const SIDEBAR_CHATS = [
  "Explain the CAP theorem",
  "Pricing page copy ideas",
  "Is a tomato a fruit?",
];

export function ProductDemo() {
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(([entry]) => {
      frame.toggleAttribute("data-offscreen", !entry?.isIntersecting);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className={cn(
        "hero-frame bg-surface shadow-float group/demo relative overflow-hidden rounded-[1.25rem] border",
        paused && "demo-paused"
      )}
    >
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="bg-border-strong size-2.5 rounded-full" />
        <span className="bg-border-strong size-2.5 rounded-full" />
        <span className="bg-border-strong size-2.5 rounded-full" />
        <span className="text-muted-foreground bg-muted mx-auto rounded-md px-3 py-0.5 font-mono text-[11px]">
          kakcil.app/chat
        </span>
      </div>

      <div key={cycle} className="flex">
        <aside className="bg-sidebar hidden w-[19%] shrink-0 flex-col gap-3 border-r p-3 md:flex">
          <div className="flex items-center gap-2 px-1">
            <LogoMark size={16} />
            <span className="font-display text-sm leading-none">KAKCIL</span>
          </div>
          <div className="bg-surface flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px]">
            <Plus className="size-3" />
            New chat
          </div>
          <div className="text-muted-foreground px-1 text-[10px]">Today</div>
          <div
            className="demo-in bg-muted truncate rounded-md px-2 py-1 text-[11px]"
            style={delay(1.2)}
          >
            Rust or Go for backend
          </div>
          {SIDEBAR_CHATS.map((chat) => (
            <div
              key={chat}
              className="text-muted-foreground truncate rounded-md px-2 py-1 text-[11px]"
            >
              {chat}
            </div>
          ))}
        </aside>

        <div className="bg-canvas bg-dots [container-type:inline-size] relative aspect-[5/3] min-w-0 flex-1 overflow-hidden">
          <div
            className="demo-cycle absolute inset-0"
            style={{ animationDuration: `${CYCLE_SECONDS}s` }}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) {
                setCycle((value) => value + 1);
              }
            }}
          >
            <DemoStage />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-2.5">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play demo" : "Pause demo"}
          className="hover:bg-muted flex size-7 items-center justify-center rounded-full transition-colors"
        >
          {paused ? (
            <Play className="size-3.5 fill-current" />
          ) : (
            <Pause className="size-3.5 fill-current" />
          )}
        </button>
        <div
          key={`chapter-${cycle}`}
          className="relative hidden h-5 w-44 shrink-0 sm:block"
        >
          {CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.label}
              className={`demo-caption demo-caption-${index + 1} absolute inset-0 flex items-center gap-2 text-xs font-medium whitespace-nowrap`}
            >
              <span className="text-muted-foreground font-mono">
                0{index + 1}
              </span>
              {chapter.label}
            </span>
          ))}
        </div>
        <div key={cycle} className="bg-muted relative h-1 flex-1 rounded-full">
          <div
            className="demo-progress bg-foreground absolute inset-y-0 left-0 rounded-full"
            style={{ animationDuration: `${CYCLE_SECONDS}s` }}
          />
          {CHAPTERS.slice(1).map((chapter) => (
            <span
              key={chapter.label}
              className="bg-background absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full"
              style={{ left: `${chapter.start}%` }}
            />
          ))}
        </div>
        <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
          0:{String(CYCLE_SECONDS).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
