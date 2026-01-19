"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Check, Sparkles, Bot } from "lucide-react";

const AI_MODELS = [
  { name: "Gemini" },
  { name: "GPT-4o" },
  { name: "Claude" },
];

interface CouncilDebateModalProps {
  isOpen: boolean;
}

type Stage = "gathering" | "voting" | "finalizing";

export function CouncilDebateModal({ isOpen }: CouncilDebateModalProps) {
  const [stage, setStage] = useState<Stage>("gathering");
  const [gatheredModels, setGatheredModels] = useState<number[]>([]);
  const [votedModels, setVotedModels] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setStage("gathering");
      setGatheredModels([]);
      setVotedModels([]);
      return;
    }

    // Stage 1: Gathering responses (staggered)
    AI_MODELS.forEach((_, index) => {
      setTimeout(() => {
        setGatheredModels((prev) => [...prev, index]);
      }, 500 + index * 400);
    });

    // Stage 2: Move to voting after all gathered
    setTimeout(() => {
      setStage("voting");
      setVotedModels([]);
      
      // Stagger the votes
      AI_MODELS.forEach((_, index) => {
        setTimeout(() => {
          setVotedModels((prev) => [...prev, index]);
        }, 500 + index * 400);
      });
    }, 500 + AI_MODELS.length * 400 + 500);

    // Stage 3: Move to finalizing after all voted
    setTimeout(() => {
      setStage("finalizing");
    }, 500 + AI_MODELS.length * 400 + 500 + 500 + AI_MODELS.length * 400 + 300);
  }, [isOpen]);

  const stageTitle = {
    gathering: "Gathering Responses",
    voting: "Council Voting",
    finalizing: "Finalizing Response",
  }[stage];

  const stageDescription = {
    gathering: "Models generating answers",
    voting: "Evaluating quality",
    finalizing: "Preparing final answer",
  }[stage];

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-black/10 [&>button]:hidden">
        <DialogTitle className="sr-only">{stageTitle}</DialogTitle>
        
        <div className="space-y-6 py-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-black/5">
              {stage === "finalizing" ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <Sparkles className="h-8 w-8 text-black animate-pulse" />
              )}
            </div>
            <h3 className="text-xl font-bold text-black">{stageTitle}</h3>
            <p className="text-sm text-gray-500">{stageDescription}</p>
          </div>

          {/* Models */}
          {stage !== "finalizing" && (
            <div className="space-y-3">
              {AI_MODELS.map((model, index) => {
                const hasGathered = gatheredModels.includes(index);
                const isGathering = stage === "gathering" && gatheredModels.length === index;
                const hasVoted = votedModels.includes(index);
                const isVoting = stage === "voting" && votedModels.length === index;

                const isActive = isGathering || isVoting;
                const isComplete = (stage === "gathering" && hasGathered) || (stage === "voting" && hasVoted);

                return (
                  <div
                    key={model.name}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-500 ${
                      isComplete
                        ? "border-green-500 bg-green-50"
                        : isActive
                        ? "border-black/20 bg-white scale-105 shadow-lg"
                        : "border-black/10 bg-gray-50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bot className={`h-6 w-6 ${isComplete ? "text-green-600" : "text-black"}`} />
                      <span className={`font-semibold ${isComplete ? "text-green-700" : "text-black"}`}>
                        {model.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                      )}
                      {isComplete && (
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Finalizing stage - just spinner */}
          {stage === "finalizing" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-black" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
