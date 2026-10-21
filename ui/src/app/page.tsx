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
import { ProductDemo } from "@/components/landing/product-demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AsciiGravity } from "@/components/ascii/ascii-gravity";

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
    body: "Mix up to six models across six providers and change them whenever you like.",
  },
];

export default function Home() {
  return (
    <div className="bg-background min-h-dvh">
      <LandingNav />

      <main>
        <section className="relative overflow-hidden">
          <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-32 pb-14 md:px-6 md:pt-40">
            <div className="animate-fade-up flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-6">
                <span className="text-muted-foreground bg-surface inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide uppercase">
                  <span className="bg-foreground size-1.5 rounded-full" />
                  Multi-model consensus
                </span>
                <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                  Ask once.
                  <br />
                  Let the council decide.
                </h1>
              </div>
              <div className="max-w-sm space-y-6 md:pb-2">
                <p className="text-muted-foreground text-base md:text-lg">
                  Kakcil sends your question to several AI models, has them vote
                  on each other&apos;s answers, and gives you the one they agree
                  is best.
                </p>
                <div className="flex items-center gap-2">
                  <AuthActions size="lg" />
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-24 md:px-6">
            <ProductDemo />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <div className="max-w-xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                How it works
              </h2>
              <p className="text-muted-foreground">
                One question, a council of models, and a vote on the best
                answer.
              </p>
            </div>
            <HowItWorks />
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
      </main>

      <footer className="border-t">
        <AsciiGravity
          lines={["KAKCIL"]}
          cellSize={8}
          mobileCellSize={5}
          cellGap={2}
          className="h-[34vh] min-h-56 md:h-[46vh]"
          label="Kakcil"
        />
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t px-4 py-6 text-sm md:flex-row md:px-6">
          <Logo className="text-foreground" size={20} />
          <p className="font-mono text-xs">
            Hover to disturb the council · click to scatter
          </p>
          <p>© {new Date().getFullYear()} Kakcil</p>
        </div>
      </footer>
    </div>
  );
}
