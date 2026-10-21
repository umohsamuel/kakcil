"use client";

import { memo } from "react";
import type { NodeProps } from "reactflow";
import { AlertCircle, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESPONSE_WIDTH, type ResponseNodeData } from "@/lib/chat-graph-layout";
import { BottomSource, RightSource, TopTarget } from "./node-handles";

function StatusBadge({ data }: { data: ResponseNodeData }) {
  if (data.status === "generating") {
    return <Loader2 className="text-muted-foreground size-3.5 animate-spin" />;
  }
  if (data.status === "voting") {
    return (
      <span className="text-muted-foreground animate-shimmer font-mono text-[10px] uppercase">
        voting
      </span>
    );
  }
  if (data.status === "failed") {
    return <AlertCircle className="text-destructive size-3.5" />;
  }
  if (data.status === "winner") {
    return (
      <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] uppercase">
        <Crown className="size-3" />
        Best
      </span>
    );
  }
  return null;
}

function ResponseNodeComponent({
  data,
  selected,
}: NodeProps<ResponseNodeData>) {
  const failed = data.status === "failed";

  return (
    <div
      style={{ width: RESPONSE_WIDTH }}
      className={cn(
        "bg-surface shadow-soft cursor-pointer rounded-xl border px-3.5 py-3 transition-[box-shadow,border-color]",
        data.status === "winner" && "border-foreground",
        failed && "border-dashed",
        selected && "ring-foreground ring-offset-canvas ring-2 ring-offset-4"
      )}
    >
      <TopTarget />
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[11px] font-medium tracking-tight">
          {data.model}
        </span>
        <StatusBadge data={data} />
      </div>
      {failed ? (
        <p className="text-destructive line-clamp-3 text-xs leading-relaxed">
          {data.error || "This model did not respond"}
        </p>
      ) : data.preview ? (
        <p className="text-muted-foreground line-clamp-4 text-xs leading-relaxed">
          {data.preview}
        </p>
      ) : (
        <div className="space-y-1.5 py-0.5" aria-hidden>
          <div className="bg-muted animate-shimmer h-2 w-full rounded" />
          <div className="bg-muted animate-shimmer h-2 w-4/5 rounded" />
          <div className="bg-muted animate-shimmer h-2 w-3/5 rounded" />
        </div>
      )}
      {typeof data.votes === "number" && data.votes > 0 && (
        <div className="text-muted-foreground mt-2 font-mono text-[10px]">
          {data.votes} {data.votes === 1 ? "vote" : "votes"}
        </div>
      )}
      <BottomSource />
      <RightSource />
    </div>
  );
}

export const ResponseNode = memo(ResponseNodeComponent);
