"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { useCouncilMembers } from "@/hooks/use-council";
import { ChatComposer } from "./chat-composer";

const SUGGESTIONS = [
  "Should I learn Rust or Go for backend work in 2026?",
  "Explain the CAP theorem with a real-world example",
  "Draft a polite follow-up email after a job interview",
  "What are the trade-offs of microservices vs a monolith?",
];

interface NewChatHeroProps {
  hasKeys: boolean;
  onSend: (message: string) => void;
}

export function NewChatHero({ hasKeys, onSend }: NewChatHeroProps) {
  const { members } = useCouncilMembers();
  const [seed, setSeed] = useState({ value: "", version: 0 });
  const activeMembers = members.filter((member) => member.is_active);

  return (
    <div className="bg-dots flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12">
      <div className="animate-fade-up w-full max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <LogoMark size={40} className="mx-auto" />
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            What should the council decide?
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-sm md:text-base">
            Every model in your council answers, then they vote on the best
            response. Branch from any answer to explore further.
          </p>
        </div>

        {!hasKeys ? (
          <div className="bg-surface shadow-float space-y-4 rounded-2xl border p-6 text-center">
            <KeyRound className="mx-auto size-5" />
            <div className="space-y-1">
              <h2 className="font-semibold">Add an API key to get started</h2>
              <p className="text-muted-foreground text-sm">
                Kakcil runs on your own OpenAI, Anthropic or Google keys. They
                are encrypted at rest and only used for your requests.
              </p>
            </div>
            <Button asChild>
              <Link href="/settings#api-keys">Add API key</Link>
            </Button>
          </div>
        ) : (
          <ChatComposer
            key={seed.version}
            initialValue={seed.value}
            onSend={onSend}
            autoFocus
          />
        )}

        {hasKeys && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  setSeed((current) => ({
                    value: suggestion,
                    version: current.version + 1,
                  }))
                }
                className="bg-surface text-muted-foreground hover:text-foreground hover:border-border-strong rounded-xl border px-4 py-3 text-left text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {activeMembers.length > 0 && (
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span>Your council:</span>
            {activeMembers.map((member) => (
              <span
                key={member.id}
                className="bg-surface rounded-full border px-2 py-0.5 font-mono text-[11px]"
              >
                {member.model_name}
              </span>
            ))}
            <Link
              href="/settings#council"
              className="hover:text-foreground ml-1 inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <Settings2 className="size-3" />
              Edit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
