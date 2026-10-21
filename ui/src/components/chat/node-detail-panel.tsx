"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Crown,
  GitBranch,
  Loader2,
  MessagesSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";
import { cn } from "@/lib/utils";
import {
  PENDING_ID,
  answerNodeId,
  responseNodeId,
  type ChatGraphLayout,
  type CouncilNodeData,
} from "@/lib/chat-graph-layout";
import type { CouncilStream } from "@/store/council-stream";
import type { ModelStatus } from "@/types/chat";

export interface BranchSource {
  responseId: string;
  roundId: string;
  model: string;
}

interface NodeDetailPanelProps {
  data: CouncilNodeData;
  layout: ChatGraphLayout;
  stream?: CouncilStream;
  pendingLaneKey?: string;
  activeLaneKey?: string;
  activeBranchResponseId?: string;
  canReply: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onBranch: (source: BranchSource) => void;
  onContinue: (laneKey: string) => void;
  className?: string;
}

interface ResponseSummary {
  nodeId: string;
  model: string;
  status: ModelStatus;
  votes?: number;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

export function NodeDetailPanel({
  data,
  layout,
  stream,
  pendingLaneKey,
  activeLaneKey,
  activeBranchResponseId,
  canReply,
  onClose,
  onSelectNode,
  onBranch,
  onContinue,
  className,
}: NodeDetailPanelProps) {
  const { copied, copy } = useCopy();
  const isPending = data.roundId === PENDING_ID;
  const round = isPending ? undefined : layout.rounds.get(data.roundId);
  const laneKey = isPending
    ? pendingLaneKey
    : layout.roundLane.get(data.roundId);
  const lane = laneKey ? layout.lanes.get(laneKey) : undefined;
  const prompt = isPending ? (stream?.prompt ?? "") : (round?.prompt ?? "");

  let title = "Your question";
  let subtitle: string | undefined = lane?.label;
  let content = "";
  let streaming = false;
  let branchSource: BranchSource | null = null;

  if (data.kind === "response") {
    title = data.model;
    if (isPending) {
      const entry = stream?.models[data.model];
      content = entry?.content ?? "";
      streaming = entry?.status === "generating";
    } else if (data.responseId) {
      const response = layout.responses.get(data.responseId);
      content = response?.content ?? "";
      branchSource = response
        ? {
            responseId: response.id,
            roundId: data.roundId,
            model: response.model,
          }
        : null;
    }
  }

  if (data.kind === "answer") {
    title = "Council answer";
    subtitle = data.model ? `Chosen: ${data.model}` : subtitle;
    if (isPending) {
      content = stream?.answer ?? "";
      streaming = !stream?.answer && stream?.phase !== "error";
    } else {
      content = round?.answer?.content ?? "";
      const winner = round?.responses.find((response) => response.is_winner);
      branchSource = winner
        ? { responseId: winner.id, roundId: data.roundId, model: winner.model }
        : null;
    }
  }

  const responses: ResponseSummary[] = isPending
    ? (stream?.order ?? []).map((model) => ({
        nodeId: responseNodeId(PENDING_ID, model),
        model,
        status: stream!.models[model]!.status,
        votes: stream!.models[model]!.votes,
      }))
    : (round?.responses ?? []).map((response) => ({
        nodeId: responseNodeId(data.roundId, response.id),
        model: response.model,
        status: response.is_winner ? "winner" : "completed",
        votes: response.votes_received,
      }));

  const isActiveLane = !!laneKey && laneKey === activeLaneKey;
  const isActiveBranch =
    !!branchSource && branchSource.responseId === activeBranchResponseId;

  return (
    <aside
      className={cn("bg-background flex h-full min-h-0 flex-col", className)}
    >
      <header className="flex items-start gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {data.kind === "answer" && <Crown className="size-4 shrink-0" />}
            <h2
              className={cn(
                "truncate text-sm font-semibold",
                data.kind === "response" && "font-mono"
              )}
            >
              {title}
            </h2>
            {data.kind === "response" && data.status === "winner" && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-mono text-[10px] uppercase">
                Best
              </span>
            )}
            {streaming && (
              <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {subtitle}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close details"
          className="-mr-2 size-8"
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {data.kind === "prompt" ? (
          <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">
            {prompt}
          </p>
        ) : (
          <details className="group bg-surface-muted rounded-lg border px-3.5 py-2.5">
            <summary className="text-muted-foreground cursor-pointer list-none text-xs font-medium select-none">
              <span className="group-open:hidden">Show question</span>
              <span className="hidden group-open:inline">Question</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {prompt}
            </p>
          </details>
        )}

        {data.kind !== "prompt" &&
          (content ? (
            <MarkdownMessage content={content} />
          ) : data.kind === "response" && data.status === "failed" ? (
            <p className="text-destructive text-sm">
              {data.error || "This model did not respond."}
            </p>
          ) : data.kind === "answer" && data.status === "error" ? (
            <p className="text-destructive text-sm">
              {data.error || "The council could not answer."}
            </p>
          ) : (
            <p className="text-muted-foreground animate-shimmer text-sm">
              Waiting for the council…
            </p>
          ))}

        {responses.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-muted-foreground font-mono text-[11px] tracking-wider uppercase">
              Council
            </h3>
            <ul className="space-y-1.5">
              {responses.map((response) => (
                <li key={response.nodeId}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(response.nodeId)}
                    className="hover:bg-muted flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">
                      {response.model}
                    </span>
                    {typeof response.votes === "number" &&
                      response.votes > 0 && (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {response.votes}v
                        </span>
                      )}
                    {response.status === "winner" && (
                      <Crown className="size-3.5" />
                    )}
                    {response.status === "generating" && (
                      <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                    )}
                    {response.status === "failed" && (
                      <span className="text-destructive text-[10px]">
                        failed
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {!isPending && round?.answer && data.kind !== "answer" && (
              <button
                type="button"
                onClick={() => onSelectNode(answerNodeId(data.roundId))}
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
              >
                View council answer
              </button>
            )}
          </section>
        )}
      </div>

      {(content || (!isPending && laneKey)) && (
        <footer className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
          {content && !streaming && (
            <Button variant="outline" size="sm" onClick={() => copy(content)}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          {branchSource && canReply && (
            <Button
              variant={isActiveBranch ? "default" : "outline"}
              size="sm"
              onClick={() => onBranch(branchSource!)}
            >
              <GitBranch />
              {isActiveBranch ? "Branching from here" : "Branch from here"}
            </Button>
          )}
          {!isPending && laneKey && canReply && (
            <Button
              variant={isActiveLane ? "default" : "ghost"}
              size="sm"
              onClick={() => onContinue(laneKey)}
            >
              <MessagesSquare />
              {isActiveLane
                ? "Replying in this thread"
                : "Reply in this thread"}
            </Button>
          )}
        </footer>
      )}
    </aside>
  );
}
