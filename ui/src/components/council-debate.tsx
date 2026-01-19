"use client";

import { useEffect, useState } from "react";
import { Bot, Cpu, Zap, BrainCircuit, CheckCircle2 } from "lucide-react";

const AI_MODELS = [
  { name: "Gemini 1.5 Pro", color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/30" },
  { name: "GPT-4o", color: "text-blue-500", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { name: "Claude 3.5 Sonnet", color: "text-purple-500", bg: "bg-purple-500/20", border: "border-purple-500/30" },
];

const DEBATE_STAGES = [
  "Analyzing semantic context...",
  "Cross-referencing knowledge bases...",
  "Simulating adversarial viewpoints...",
  "Synthesizing consensus...",
  "Finalizing output...",
];

export function CouncilDebate() {
  const [currentStage, setCurrentStage] = useState(0);
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % DEBATE_STAGES.length);
    }, 2000);

    const nodeInterval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % AI_MODELS.length);
    }, 600);

    return () => {
      clearInterval(stageInterval);
      clearInterval(nodeInterval);
    };
  }, []);

  return (
    <div className="w-full min-w-[300px] p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-500/5 animate-pulse" />
      
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span className="font-bold text-sm tracking-wide uppercase text-indigo-500">Council Active</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground tabular-nums">
                {(Math.random() * 100).toFixed(2)}ms
            </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-3 gap-3">
          {AI_MODELS.map((model, index) => (
             <div 
               key={model.name}
               className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 ${
                 index === activeNode 
                  ? `${model.bg} ${model.border} scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]` 
                  : "bg-transparent border-transparent opacity-50 grayscale"
               }`}
             >
                <Bot className={`h-6 w-6 mb-2 ${model.color}`} />
                <span className={`text-[10px] font-bold text-center leading-tight ${model.color}`}>{model.name}</span>
                {index === activeNode && (
                    <div className="absolute top-1 right-1">
                        <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500 animate-bounce" />
                    </div>
                )}
             </div>
          ))}
        </div>

        {/* Console Log Stage */}
        <div className="space-y-2">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-in-out"
                   style={{ width: `${((currentStage + 1) / DEBATE_STAGES.length) * 100}%` }}
                />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground h-4">
                <span className="animate-spin">◴</span>
                <span className="animate-pulse">{DEBATE_STAGES[currentStage]}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
