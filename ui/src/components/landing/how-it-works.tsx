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
        <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
          <ArrowUp className="size-3.5 transition-transform duration-500 group-hover:-translate-y-[120%] group-hover:opacity-0" />
        </span>
      </div>
    </div>
  );
}

const ANSWERS = [
  { model: "gpt-6.1-sol", width: "group-hover:w-4/5", delay: "delay-0" },
  { model: "claude-opus-5-5", width: "group-hover:w-3/5", delay: "delay-100" },
  { model: "gemini-4-argon", width: "group-hover:w-11/12", delay: "delay-200" },
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
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={`bg-foreground/70 h-full w-1/5 rounded-full transition-[width] duration-700 ease-out ${answer.width} ${answer.delay}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const TALLY = [
  { model: "claude-opus-5-5", votes: 2, winner: true },
  { model: "gpt-6.1-sol", votes: 1 },
  { model: "gemini-4-argon", votes: 0 },
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
              className={`h-full origin-left scale-x-50 transition-transform duration-700 ease-out group-hover:scale-x-100 ${row.winner ? "bg-foreground" : "bg-edge"}`}
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
          <div className="group bg-surface-muted flex flex-1 flex-col overflow-hidden rounded-3xl transition-transform duration-500 ease-out hover:-translate-y-1.5">
            <div className="bg-background bg-dots m-2 flex h-48 items-center justify-center rounded-[1.25rem] px-6">
              {step.visual}
            </div>
            <div className="space-y-2 px-6 pt-3 pb-6">
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
