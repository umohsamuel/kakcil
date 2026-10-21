import {
  GitBranch,
  KeyRound,
  Layers,
  Network,
  Radio,
  Vote,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthActions, LandingNav } from "@/components/landing/landing-nav";
import { CouncilPreview } from "@/components/landing/council-preview";

const STEPS = [
  {
    title: "Ask once",
    body: "Send a question to your council — the models you picked from OpenAI, Anthropic and Google.",
  },
  {
    title: "Every model answers",
    body: "Responses stream in side by side so you can compare how each model thinks.",
  },
  {
    title: "The council votes",
    body: "Each model scores the others on accuracy, completeness, clarity, relevance and concision. The best answer wins.",
  },
];

const FEATURES = [
  {
    icon: Network,
    title: "A canvas, not a transcript",
    body: "Every conversation is a graph of prompts, responses and answers you can pan, zoom and revisit.",
  },
  {
    icon: GitBranch,
    title: "Branch from any response",
    body: "Pick up from any model's answer, not just the winner, and keep both threads side by side.",
  },
  {
    icon: Vote,
    title: "Transparent voting",
    body: "See which model won and how many votes each response earned.",
  },
  {
    icon: KeyRound,
    title: "Bring your own keys",
    body: "Use your own provider keys. They're encrypted at rest and only used for your requests.",
  },
  {
    icon: Radio,
    title: "Live streaming",
    body: "Watch each model write in real time, even if you navigate to another chat.",
  },
  {
    icon: Layers,
    title: "Your council, your call",
    body: "Mix up to six models across providers and change them whenever you like.",
  },
];

export default function Home() {
  return (
    <div className="bg-background min-h-dvh">
      <LandingNav />

      <main>
        <section className="relative overflow-hidden">
          <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center md:px-6 md:pt-28">
            <div className="animate-fade-up mx-auto max-w-3xl space-y-6">
              <span className="text-muted-foreground bg-surface inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide uppercase">
                <span className="bg-foreground size-1.5 rounded-full" />
                Multi-model consensus
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                Ask once.
                <br />
                Let the council decide.
              </h1>
              <p className="text-muted-foreground mx-auto max-w-xl text-base text-balance md:text-lg">
                Kakcil sends your question to several AI models, has them vote
                on each other&apos;s answers, and gives you the one they agree
                is best.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <AuthActions size="lg" />
              </div>
            </div>
          </div>
          <div className="relative mx-auto max-w-5xl px-4 pb-24 md:px-6">
            <CouncilPreview />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              How it works
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="space-y-3">
                  <span className="text-muted-foreground font-mono text-xs">
                    0{index + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Built for better answers
            </h2>
            <div className="bg-border mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-background space-y-3 p-6">
                  <Icon className="size-5" />
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              Stop trusting a single model.
            </h2>
            <div className="flex items-center gap-2">
              <AuthActions size="lg" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm md:flex-row md:px-6">
          <Logo className="text-foreground" size={20} />
          <p>© {new Date().getFullYear()} Kakcil</p>
        </div>
      </footer>
    </div>
  );
}
