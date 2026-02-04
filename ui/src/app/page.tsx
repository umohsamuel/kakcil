import { Sparkles, Zap, Shield } from "lucide-react";
import { AnimatedBackground } from "@/components/backgrounds";
import { NavHome } from "@/components/nav/home.nav";
import { CTAButtonClient } from "@/views/home/home.client";
export default function Home() {
  return (
    <div className="bg-background text-foreground relative flex h-dvh flex-col overflow-hidden">
      <AnimatedBackground />
      <NavHome />
      <main className="relative flex h-dvh w-full flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-5xl space-y-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter md:text-7xl lg:text-7xl">
            Decisions by
            <br />
            <span className="bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent">
              Consensus
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed font-light text-gray-600 md:text-2xl">
            Harness the collective intelligence of multiple AI models. Get
            answers you can trust through democratic debate.
          </p>
          <CTAButtonClient />
        </div>

        <div className="absolute bottom-20 left-1/2 hidden max-w-3xl -translate-x-1/2 flex-wrap justify-center gap-6 lg:flex">
          {pillsInfo.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm"
            >
              {feature.icon}
              {feature.text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
const pillsInfo = [
  { icon: <Zap className="h-4 w-4" />, text: "Real-time Debate" },
  { icon: <Shield className="h-4 w-4" />, text: "Verified Answers" },
  { icon: <Sparkles className="h-4 w-4" />, text: "Multiple Models" },
];
