import { ArrowUp, Crown } from "lucide-react";
import type { ReactNode } from "react";

function AskVisual() {
  return (
    <div className="bg-surface shadow-soft w-full max-w-[15rem] overflow-hidden rounded-xl border">
      <div className="text-muted-foreground border-b px-3 py-1.5 font-mono text-[10px] uppercase">
        Your council · 3 models
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex-1 truncate text-xs">
          Rust or Go for backend work?
        </span>
        <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <ArrowUp className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

const ANSWERS = [
  { model: "gpt-4o", width: "w-4/5" },
  { model: "claude-sonnet-4-5", width: "w-3/5" },
  { model: "gemini-2.5-pro", width: "w-11/12" },
];

function AnswerVisual() {
  return (
    <div className="w-full max-w-[15rem] space-y-2">
      {ANSWERS.map((answer) => (
        <div
          key={answer.model}
          className="bg-surface shadow-soft rounded-lg border px-3 py-2"
        >
          <div className="mb-1.5 font-mono text-[10px]">{answer.model}</div>
          <div className={`bg-muted h-1.5 rounded-full ${answer.width}`} />
        </div>
      ))}
    </div>
  );
}

const TALLY = [
  { model: "claude-sonnet-4-5", votes: 2, winner: true },
  { model: "gpt-4o", votes: 1 },
  { model: "gemini-2.5-pro", votes: 0 },
];

function VoteVisual() {
  return (
    <div className="bg-surface shadow-soft w-full max-w-[15rem] space-y-2.5 rounded-xl border p-3">
      {TALLY.map((row) => (
        <div key={row.model} className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="flex items-center gap-1">
              {row.winner && <Crown className="size-3" />}
              {row.model}
            </span>
            <span className="text-muted-foreground">{row.votes}</span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={row.winner ? "bg-foreground h-full" : "bg-edge h-full"}
              style={{ width: `${(row.votes / 2) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const STEPS: { title: string; body: string; visual: ReactNode }[] = [
  {
    title: "Ask once",
    body: "Send one question to the models you picked from OpenAI, Anthropic, Google, DeepSeek, xAI and Moonshot.",
    visual: <AskVisual />,
  },
  {
    title: "Every model answers",
    body: "Answers stream in side by side on a canvas, so you can see how each model reasons.",
    visual: <AnswerVisual />,
  },
  {
    title: "The council votes",
    body: "Each model scores the others on accuracy, completeness, clarity, relevance and concision. The best answer wins.",
    visual: <VoteVisual />,
  },
];

export function HowItWorks() {
  return (
    <ol className="relative mt-12 grid gap-6 md:grid-cols-3 md:gap-5">
      <div
        aria-hidden
        className="bg-border absolute top-4 right-[16%] left-[16%] hidden h-px md:block"
      />
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-5">
          <span className="bg-background text-foreground relative z-10 mx-auto flex size-8 items-center justify-center rounded-full border font-mono text-xs">
            {index + 1}
          </span>
          <div className="bg-surface flex flex-1 flex-col overflow-hidden rounded-2xl border">
            <div className="bg-canvas bg-dots flex h-44 items-center justify-center border-b px-6">
              {step.visual}
            </div>
            <div className="space-y-2 p-5">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
