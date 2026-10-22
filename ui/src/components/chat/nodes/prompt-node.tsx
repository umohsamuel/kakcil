"use client";

import { memo } from "react";
import type { NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMPT_WIDTH, type PromptNodeData } from "@/lib/chat-graph-layout";
import { BottomSource, LeftTarget, TopTarget } from "./node-handles";

function PromptNodeComponent({ data, selected }: NodeProps<PromptNodeData>) {
  return (
    <div style={{ width: PROMPT_WIDTH }} className="relative">
      {data.branchLabel && (
        <div className="bg-background text-foreground absolute -top-7 left-0 flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
          <GitBranch className="size-3 shrink-0" />
          <span className="truncate">{data.branchLabel}</span>
        </div>
      )}
      <div
        className={cn(
          "bg-primary text-primary-foreground shadow-soft cursor-pointer rounded-xl px-4 py-3 transition-shadow",
          selected && "ring-foreground ring-offset-canvas ring-2 ring-offset-4"
        )}
      >
        <TopTarget />
        <LeftTarget />
        <div className="mb-1.5 font-mono text-[10px] tracking-widest uppercase opacity-60">
          You
        </div>
        <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
          {data.text}
        </p>
        <BottomSource />
      </div>
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent);
