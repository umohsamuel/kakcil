import type { ReactNode } from "react";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Walkthrough } from "@/components/landing/walkthrough";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  BranchVisual,
  CanvasVisual,
  CouncilVisual,
  KeysVisual,
  StreamingVisual,
  VotingVisual,
} from "@/components/landing/feature-visuals";
import { cn } from "@/lib/utils";

const FEATURES: {
  title: string;
  body: string;
  visual: ReactNode;
  className?: string;
}[] = [
  {
    title: "A canvas, not a transcript",
    body: "Every conversation is a graph of prompts, responses and answers you can pan, zoom and revisit.",
    visual: <CanvasVisual />,
    className: "lg:col-span-2",
  },
  {
    title: "Branch from any response",
    body: "Pick up from any model's answer, not just the winner, and keep both threads side by side.",
    visual: <BranchVisual />,
  },
  {
    title: "Transparent voting",
    body: "See which model won and how many votes each response earned.",
    visual: <VotingVisual />,
  },
  {
    title: "Bring your own keys",
    body: "OpenAI, Anthropic, Google, DeepSeek, xAI and Moonshot. Encrypted at rest, used only for your requests.",
    visual: <KeysVisual />,
    className: "lg:col-span-2",
  },
  {
    title: "Live streaming",
    body: "Watch each model write in real time, even after you navigate to another chat.",
    visual: <StreamingVisual />,
  },
  {
    title: "Your council, your call",
    body: "Mix up to six models across providers and change them whenever you like.",
    visual: <CouncilVisual />,
  },
];

export default function Home() {
  return (
    <div className="bg-surface-muted min-h-dvh overflow-x-clip">
      <div className="bg-background relative z-10 rounded-b-[2rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.25)] md:rounded-b-[3rem]">
        <LandingNav />

        <main>
          <Hero />

          <section
            id="how-it-works"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6"
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

          <Walkthrough />

          <section
            id="features"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 pb-32 md:px-6"
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
              {FEATURES.map(({ title, body, visual, className }) => (
                <SpotlightCard
                  key={title}
                  className={cn("flex flex-col gap-6 p-2.5", className)}
                >
                  {visual}
                  <div className="space-y-2 px-4 pb-5">
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
      </div>

      <SiteFooter />
    </div>
  );
}
