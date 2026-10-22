"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Node } from "reactflow";
import { AlertTriangle, GitBranch, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PageLoader } from "@/components/page-loader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatGraph } from "@/hooks/use-chat-graph";
import { useApiKeys } from "@/hooks/use-api-keys";
import { getErrorMessage } from "@/lib/utils";
import { siteName } from "@/constants/metadata";
import {
  PENDING_ID,
  answerNodeId,
  buildChatGraphLayout,
  buildPendingLayout,
  laneKeyOf,
  promptNodeId,
  type CouncilNodeData,
} from "@/lib/chat-graph-layout";
import {
  isStreamActive,
  startCouncilStream,
  useCouncilStreamStore,
} from "@/store/council-stream";
import type { ComposerTarget } from "@/types/chat";
import { CouncilCanvas } from "./council-canvas";
import { ChatComposer } from "./chat-composer";
import { NewChatHero } from "./new-chat-hero";
import { NodeDetailPanel, type BranchSource } from "./node-detail-panel";

const createDraftKey = () =>
  `draft:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function ChatWorkspace({ chatId }: { chatId?: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [targetOverride, setTargetOverride] = useState<ComposerTarget | null>(
    null
  );

  const streamKey = chatId ?? draftKey;
  const stream = useCouncilStreamStore((state) =>
    streamKey ? state.streams[streamKey] : undefined
  );
  const removeStream = useCouncilStreamStore((state) => state.removeStream);
  const setViewingKey = useCouncilStreamStore((state) => state.setViewingKey);

  const graphQuery = useChatGraph(chatId);
  const { activeProviders, isLoading: keysLoading } = useApiKeys();
  const hasKeys = keysLoading || activeProviders.size > 0;

  const layout = useMemo(
    () => buildChatGraphLayout(graphQuery.data),
    [graphQuery.data]
  );
  const pending = useMemo(
    () => buildPendingLayout(layout, stream),
    [layout, stream]
  );

  const nodes = useMemo(
    () => (pending ? [...layout.nodes, ...pending.nodes] : layout.nodes),
    [layout.nodes, pending]
  );
  const edges = useMemo(
    () => (pending ? [...layout.edges, ...pending.edges] : layout.edges),
    [layout.edges, pending]
  );

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );
  const selectedNode = selectedNodeId
    ? nodeById.get(selectedNodeId)
    : undefined;

  const target = useMemo<ComposerTarget>(() => {
    if (targetOverride?.kind === "branch") {
      if (layout.responses.has(targetOverride.responseId))
        return targetOverride;
    } else if (targetOverride?.kind === "thread") {
      if (layout.lanes.has(laneKeyOf(targetOverride.branchId))) {
        return targetOverride;
      }
    }
    return {
      kind: "thread",
      branchId: layout.lanes.get(layout.latestLane)?.branchId ?? null,
    };
  }, [targetOverride, layout]);

  const activeLaneKey =
    target.kind === "thread" ? laneKeyOf(target.branchId) : undefined;
  const hasHistory = layout.rounds.size > 0;
  const branchCount = layout.lanes.size - 1;

  const focusNodeIds = useMemo(() => {
    if (pending) {
      return [promptNodeId(PENDING_ID), answerNodeId(PENDING_ID)];
    }
    if (!layout.latestRoundId) return [];
    const round = layout.rounds.get(layout.latestRoundId);
    return [
      promptNodeId(layout.latestRoundId),
      ...(round?.answer ? [answerNodeId(layout.latestRoundId)] : []),
    ];
  }, [pending, layout]);

  useEffect(() => {
    setViewingKey(streamKey);
    return () => setViewingKey(null);
  }, [streamKey, setViewingKey]);

  const chatTitle = graphQuery.data?.chat.title || stream?.topic;

  useEffect(() => {
    if (!chatTitle) return;
    const previous = document.title;
    document.title = `${chatTitle} | ${siteName}`;
    return () => {
      document.title = previous;
    };
  }, [chatTitle]);

  const streaming = isStreamActive(stream);

  const send = (message: string, sendTarget: ComposerTarget = target) => {
    setSelectedNodeId(null);

    if (chatId) {
      startCouncilStream({
        key: chatId,
        chatId,
        message,
        target: sendTarget,
        onBranchCreated: (branchId) =>
          setTargetOverride({ kind: "thread", branchId }),
      });
      return;
    }

    const key = createDraftKey();
    setDraftKey(key);
    startCouncilStream({
      key,
      message,
      target: { kind: "thread", branchId: null },
      onChatCreated: (id) => router.replace(`/chat/${id}`),
    });
  };

  const retry = () => {
    if (!stream) return;
    send(stream.prompt, stream.target);
  };

  const dismissError = () => {
    if (!streamKey) return;
    removeStream(streamKey);
    if (!chatId) setDraftKey(null);
  };

  const handleBranch = (source: BranchSource) => {
    setTargetOverride({ kind: "branch", ...source });
    if (isMobile) setSelectedNodeId(null);
  };

  const handleContinue = (laneKey: string) => {
    setTargetOverride({
      kind: "thread",
      branchId: layout.lanes.get(laneKey)?.branchId ?? null,
    });
    if (isMobile) setSelectedNodeId(null);
  };

  const handleSelect = useCallback(
    (node: Node<CouncilNodeData> | null) => setSelectedNodeId(node?.id ?? null),
    []
  );

  if (chatId && graphQuery.isLoading) {
    return <PageLoader className="min-h-0 flex-1" label="Loading chat…" />;
  }

  if (chatId && graphQuery.error && !stream) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertTriangle className="text-muted-foreground size-6" />
        <div className="space-y-1">
          <h2 className="font-semibold">This chat could not be opened</h2>
          <p className="text-muted-foreground text-sm">
            {getErrorMessage(graphQuery.error)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chat">Start a new chat</Link>
        </Button>
      </div>
    );
  }

  if (!hasHistory && !stream) {
    return (
      <NewChatHero hasKeys={hasKeys} onSend={(message) => send(message)} />
    );
  }

  const targetLabel =
    target.kind === "branch"
      ? `Branching from ${target.model}`
      : target.branchId
        ? `Replying in ${layout.lanes.get(target.branchId)?.label ?? "branch"}`
        : branchCount > 0
          ? "Replying in main thread"
          : undefined;

  const panel = selectedNode ? (
    <NodeDetailPanel
      data={selectedNode.data}
      layout={layout}
      stream={stream}
      pendingLaneKey={pending?.laneKey}
      activeLaneKey={activeLaneKey}
      activeBranchResponseId={
        target.kind === "branch" ? target.responseId : undefined
      }
      canReply={!!chatId}
      onClose={() => setSelectedNodeId(null)}
      onSelectNode={setSelectedNodeId}
      onBranch={handleBranch}
      onContinue={handleContinue}
    />
  ) : null;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="bg-canvas/80 absolute inset-x-0 top-0 z-10 flex items-center gap-3 border-b px-4 py-2.5 backdrop-blur md:px-5">
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
            {graphQuery.data?.chat.title ||
              stream?.topic ||
              stream?.prompt ||
              "New chat"}
          </h1>
          {branchCount > 0 && (
            <span className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-[11px]">
              <GitBranch className="size-3.5" />
              {branchCount} {branchCount === 1 ? "branch" : "branches"}
            </span>
          )}
        </header>

        <div className="min-h-0 flex-1">
          <CouncilCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelect={handleSelect}
            focusNodeIds={focusNodeIds}
            showMinimap={!panel}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-3 pb-3 md:px-6 md:pb-5">
          <div className="pointer-events-auto w-full max-w-2xl space-y-2">
            {stream?.phase === "error" && (
              <div className="bg-surface shadow-float flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm">
                <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
                <p className="min-w-0 flex-1">{stream.error}</p>
                <Button size="sm" variant="outline" onClick={retry}>
                  <RotateCcw />
                  Retry
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={dismissError}
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            {!hasKeys && (
              <div className="bg-surface shadow-float flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm">
                <p className="text-muted-foreground flex-1">
                  Add an API key to keep chatting.
                </p>
                <Button asChild size="sm">
                  <Link href="/settings#api-keys">Add key</Link>
                </Button>
              </div>
            )}
            <ChatComposer
              onSend={(message) => send(message)}
              busy={streaming}
              disabled={!hasKeys || !chatId}
              placeholder={
                streaming
                  ? "The council is deliberating…"
                  : target.kind === "branch"
                    ? "Ask a follow-up on this branch…"
                    : "Ask a follow-up…"
              }
              targetLabel={targetLabel}
              targetKind={target.kind}
              onResetTarget={
                targetOverride ? () => setTargetOverride(null) : undefined
              }
            />
          </div>
        </div>
      </div>

      {!isMobile && panel && (
        <div className="w-[420px] shrink-0 border-l lg:w-[460px]">{panel}</div>
      )}

      {isMobile && (
        <Sheet
          open={!!panel}
          onOpenChange={(open) => !open && setSelectedNodeId(null)}
        >
          <SheetContent
            side="bottom"
            className="h-[85dvh] rounded-t-2xl p-0 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Details</SheetTitle>
            {panel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
