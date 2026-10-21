import type { CSSProperties } from "react";
import {
  GitBranch,
  KeyRound,
  Layers,
  Network,
  Radio,
  Vote,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { ProductDemo } from "@/components/landing/product-demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { AsciiGravity } from "@/components/ascii/ascii-gravity";
import { cn } from "@/lib/utils";

const STATEMENT =
  "Six providers. Your keys. One answer the models agree on, and every other answer one click away.";

const FEATURES = [
  {
    icon: Network,
    title: "A canvas, not a transcript",
    body: "Every conversation is a graph of prompts, responses and answers you can pan, zoom and revisit.",
    className: "lg:col-span-2",
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
    body: "OpenAI, Anthropic, Google, DeepSeek, xAI and Moonshot. Encrypted at rest, used only for your requests.",
    className: "lg:col-span-2",
  },
  {
    icon: Radio,
    title: "Live streaming",
    body: "Watch each model write in real time, even after you navigate to another chat.",
  },
  {
    icon: Layers,
    title: "Your council, your call",
    body: "Mix up to six models across providers and change them whenever you like.",
  },
];

export default function Home() {
  return (
    <div className="bg-background min-h-dvh overflow-x-clip">
      <LandingNav />

      <main>
        <Hero />

        <section
          id="showcase"
          className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 md:px-6"
        >
          <ProductDemo />
        </section>

        <section className="mx-auto max-w-5xl px-4 py-24 md:px-6 md:py-36">
          <p className="statement text-center text-[clamp(1.9rem,4.6vw,3.75rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
            {STATEMENT.split(" ").map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="reveal-word"
                style={{ "--i": index } as CSSProperties}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6"
        >
          <div className="mx-auto max-w-xl space-y-3 text-center">
            <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Three steps to a better answer
            </h2>
          </div>
          <HowItWorks />
        </section>

        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6"
        >
          <div className="mx-auto max-w-xl space-y-3 text-center">
            <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              Features
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Built for better answers
            </h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body, className }) => (
              <SpotlightCard
                key={title}
                className={cn(
                  "flex min-h-56 flex-col justify-between gap-10",
                  className
                )}
              >
                <span className="bg-background flex size-11 items-center justify-center rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6">
                  <Icon className="size-5" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pt-10 pb-6 md:px-6">
        <AsciiGravity
          lines={["KAKCIL"]}
          cellSize={9}
          mobileCellSize={5}
          cellGap={2}
          className="aspect-[4/1] w-full"
          label="Kakcil"
          fill
        />
      </footer>
    </div>
  );
}
