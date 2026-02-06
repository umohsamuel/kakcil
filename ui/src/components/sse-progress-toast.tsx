"use client";

import {
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import type { StreamPhase, ActiveStream } from "@/store/sse-stream";

interface SSEProgressToastProps {
  stream: ActiveStream;
  onDismiss?: () => void;
  onNavigate?: (chatId: string) => void;
}

interface PhaseStep {
  phase: StreamPhase;
  label: string;
  icon: typeof CheckCircle2;
}

const PHASES: PhaseStep[] = [
  { phase: "prompting", label: "Consulting models", icon: MessageSquare },
  { phase: "voting", label: "Council voting", icon: MessageSquare },
  { phase: "aggregation", label: "Aggregating", icon: MessageSquare },
];

function getPhaseIndex(phase: StreamPhase): number {
  const index = PHASES.findIndex((p) => p.phase === phase);
  if (phase === "complete") return PHASES.length;
  if (phase === "error") return -1;
  return index;
}

export function SSEProgressToast({
  stream,
  onDismiss,
  onNavigate,
}: SSEProgressToastProps) {
  const { phaseInfo, displayName, chatId, isStreaming } = stream;
  const isError = phaseInfo.phase === "error";
  const isComplete = phaseInfo.phase === "complete";

  const handleClick = () => {
    if (chatId && onNavigate) {
      onNavigate(chatId);
    }
  };

  return (
    <div
      className="bg-card border-border w-full max-w-sm space-y-3 rounded-lg border p-4 shadow-lg"
      onClick={handleClick}
      style={{ cursor: chatId ? "pointer" : "default" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isError ? (
            <AlertCircle className="text-destructive h-5 w-5 flex-shrink-0" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
          ) : (
            <Loader2 className="text-primary h-5 w-5 flex-shrink-0 animate-spin" />
          )}
          <p className="text-muted-foreground truncate text-sm">
            "{displayName}"
          </p>
        </div>
      </div>

      {/* Error message */}
      {isError && phaseInfo.errorMessage && (
        <p className="text-destructive text-sm">{phaseInfo.errorMessage}</p>
      )}

      {/* Phase indicators - only show if still processing */}
      {isStreaming && !isError && !isComplete && (
        <div className="space-y-1.5 pt-1">
          {PHASES.filter((p) => p.phase === phaseInfo.phase)?.map((step) => (
            <PhaseIndicatorRow
              key={step.phase}
              step={step}
              currentPhase={phaseInfo.phase}
              completedModels={phaseInfo.completedModels}
              modelCount={phaseInfo.modelCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseIndicatorRow({
  step,
  currentPhase,
  completedModels,
  modelCount,
}: {
  step: PhaseStep;
  currentPhase: StreamPhase;
  completedModels?: string[];
  modelCount?: number;
}) {
  const currentIndex = getPhaseIndex(currentPhase);
  const stepIndex = getPhaseIndex(step.phase);

  const isComplete = currentIndex > stepIndex;
  const isCurrent = currentIndex === stepIndex;
  const isPending = currentIndex < stepIndex;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
      {isCurrent && <Loader2 className="text-primary h-4 w-4 animate-spin" />}
      {isPending && <Circle className="text-muted-foreground/40 h-4 w-4" />}
      <span
        className={
          isComplete
            ? "text-muted-foreground"
            : isCurrent
              ? "text-foreground font-medium"
              : "text-muted-foreground/40"
        }
      >
        {step.label}
        {isCurrent && step.phase === "prompting" && completedModels && (
          <span className="ml-1 text-xs">
            ({completedModels.length}/{modelCount || "?"})
          </span>
        )}
      </span>
    </div>
  );
}

export default SSEProgressToast;
