import { Crown, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const RESPONSES = [
  {
    model: "gpt-4o",
    votes: 1,
    text: "Start with Go: smaller surface, fast builds…",
  },
  {
    model: "claude-sonnet-4-5",
    votes: 2,
    winner: true,
    text: "It depends on your goal. For services, Go…",
  },
  {
    model: "gemini-2.5-pro",
    votes: 0,
    text: "Rust gives you memory safety without a GC…",
  },
];

function PreviewCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface shadow-soft rounded-xl border px-3.5 py-3 text-left",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CouncilPreview() {
  return (
    <div className="bg-canvas bg-dots relative overflow-hidden rounded-2xl border p-5 md:p-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <div className="bg-primary text-primary-foreground shadow-soft w-full max-w-sm rounded-xl px-4 py-3 text-left">
          <div className="mb-1 font-mono text-[10px] tracking-widest uppercase opacity-60">
            You
          </div>
          <p className="text-sm">Should I learn Rust or Go for backend work?</p>
        </div>

        <div className="bg-edge h-6 w-px" />

        <div className="grid w-full gap-3 sm:grid-cols-3">
          {RESPONSES.map((response) => (
            <PreviewCard
              key={response.model}
              className={cn(response.winner && "border-foreground")}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] font-medium">
                  {response.model}
                </span>
                {response.winner && (
                  <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase">
                    <Crown className="size-2.5" />
                    Best
                  </span>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {response.text}
              </p>
              <div className="text-muted-foreground mt-1.5 font-mono text-[10px]">
                {response.votes} {response.votes === 1 ? "vote" : "votes"}
              </div>
            </PreviewCard>
          ))}
        </div>

        <div className="bg-edge-strong h-6 w-px" />

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          <PreviewCard className="border-foreground shadow-float w-full max-w-sm border-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <Crown className="size-3.5" />
              Council answer
            </div>
            <p className="text-foreground/80 text-xs leading-relaxed">
              Pick Go if you want to ship services quickly; pick Rust if you
              need tight control over performance and memory.
            </p>
          </PreviewCard>
          <div className="text-muted-foreground flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 font-mono text-[10px] uppercase">
            <GitBranch className="size-3" />
            Branch from any answer
          </div>
        </div>
      </div>
    </div>
  );
}
