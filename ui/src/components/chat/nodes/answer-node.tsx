"use client";

import { memo } from "react";
import type { NodeProps } from "reactflow";
import { AlertCircle, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANSWER_WIDTH, type AnswerNodeData } from "@/lib/chat-graph-layout";
import { BottomSource, TopTarget } from "./node-handles";

const PHASE_LABEL: Record<string, string> = {
  responding: "Council is answering…",
  voting: "Council is voting…",
  saving: "Saving answer…",
};

function AnswerNodeComponent({ data, selected }: NodeProps<AnswerNodeData>) {
  return (
    <div
      style={{ width: ANSWER_WIDTH }}
      className={cn(
        "bg-surface shadow-float cursor-pointer rounded-xl border-2 px-4 py-3.5",
        data.status === "error" ? "border-destructive/60" : "border-foreground",
        selected && "ring-foreground ring-offset-canvas ring-2 ring-offset-4"
      )}
    >
      <TopTarget />
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {data.status === "error" ? (
            <AlertCircle className="text-destructive size-3.5" />
          ) : data.status === "pending" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Crown className="size-3.5" />
          )}
          Council answer
        </span>
        {data.model && (
          <span className="text-muted-foreground truncate font-mono text-[10px]">
            {data.model}
          </span>
        )}
      </div>
      {data.status === "error" ? (
        <p className="text-destructive line-clamp-3 text-xs leading-relaxed">
          {data.error || "The council could not answer"}
        </p>
      ) : data.status === "pending" ? (
        <p className="text-muted-foreground animate-shimmer text-xs">
          {PHASE_LABEL[data.phase ?? "responding"] ?? PHASE_LABEL.responding}
        </p>
      ) : (
        <p className="text-foreground/80 line-clamp-5 text-xs leading-relaxed">
          {data.preview}
        </p>
      )}
      <BottomSource />
    </div>
  );
}

export const AnswerNode = memo(AnswerNodeComponent);
