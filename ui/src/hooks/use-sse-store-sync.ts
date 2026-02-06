/**
 * Syncs local flow SSE state with global store for toast notifications
 * 
 * This hook bridges the existing useFlowSSEChat hook with the global
 * SSE stream store, enabling persistent toast notifications while
 * keeping the local state management for the canvas.
 */
import { useEffect, useRef } from "react";
import { useSSEStreamStore, type StreamPhase } from "@/store/sse-stream";
import type { FlowConversationState } from "@/hooks/use-sse-chat";

interface UseSSEStoreSyncOptions {
  /** Unique ID for this stream (chatId or temp ID) */
  streamId: string;
  /** The local flow state to sync */
  flowState: FlowConversationState;
  /** Whether a message is being sent (to track initial start) */
  message?: string;
}

/**
 * Determine the current phase from flow state
 */
function getPhaseFromFlowState(flowState: FlowConversationState): StreamPhase {
  if (!flowState.isStreaming) {
    if (flowState.error) return "error";
    if (flowState.finalResponse) return "complete";
    return "idle";
  }

  // Check if we have vote response (aggregation phase)
  if (flowState.finalResponse) {
    return "aggregation";
  }

  // Check if models are voting
  const hasVotingModels = flowState.modelNodes.some(
    (n) => n.status === "voting"
  );
  if (hasVotingModels) {
    return "voting";
  }

  // Default to prompting if streaming
  return "prompting";
}

/**
 * Truncate message for display
 */
function truncateMessage(message: string, maxLength = 40): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + "...";
}

export function useSSEStoreSync({
  streamId,
  flowState,
  message,
}: UseSSEStoreSyncOptions) {
  const startStream = useSSEStreamStore((s) => s.startStream);
  const updatePhase = useSSEStreamStore((s) => s.updatePhase);
  const completeStream = useSSEStreamStore((s) => s.completeStream);
  const errorStream = useSSEStreamStore((s) => s.errorStream);
  const setChatId = useSSEStreamStore((s) => s.setChatId);
  const getStream = useSSEStreamStore((s) => s.getStream);

  // Track previous states to detect transitions
  const prevStreamingRef = useRef<boolean>(false);
  const prevPhaseRef = useRef<StreamPhase>("idle");
  const streamCreatedRef = useRef<boolean>(false);

  // Sync streaming state changes to global store
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isStreaming = flowState.isStreaming;
    const currentPhase = getPhaseFromFlowState(flowState);
    const prevPhase = prevPhaseRef.current;

    // Starting to stream - create stream in store
    if (isStreaming && !wasStreaming && message) {
      startStream(
        streamId,
        message,
        flowState.chatId,
        undefined // branchId - could be passed if needed
      );
      streamCreatedRef.current = true;
    }

    // Update chat ID if it changed (new chat got ID from backend)
    if (flowState.chatId && streamCreatedRef.current) {
      const stream = getStream(streamId);
      if (stream && stream.chatId !== flowState.chatId) {
        setChatId(streamId, flowState.chatId);
      }
    }

    // Phase changed - update store
    if (streamCreatedRef.current && currentPhase !== prevPhase) {
      if (currentPhase === "complete") {
        completeStream(streamId);
        streamCreatedRef.current = false;
      } else if (currentPhase === "error") {
        errorStream(streamId, flowState.error || "Unknown error");
        streamCreatedRef.current = false;
      } else if (currentPhase !== "idle") {
        // Get completed models for prompting phase
        const completedModels = flowState.modelNodes
          .filter((n) => n.status === "completed" || n.status === "voting" || n.status === "winner")
          .map((n) => n.model);

        updatePhase(streamId, currentPhase, {
          modelCount: flowState.modelNodes.length,
          completedModels,
        });
      }
    }

    // Stream stopped without completing (e.g., error)
    if (!isStreaming && wasStreaming && currentPhase !== "complete") {
      if (flowState.error) {
        errorStream(streamId, flowState.error);
      }
      streamCreatedRef.current = false;
    }

    prevStreamingRef.current = isStreaming;
    prevPhaseRef.current = currentPhase;
  }, [
    flowState.isStreaming,
    flowState.modelNodes,
    flowState.finalResponse,
    flowState.error,
    flowState.chatId,
    streamId,
    message,
    startStream,
    updatePhase,
    completeStream,
    errorStream,
    setChatId,
    getStream,
  ]);
}

export default useSSEStoreSync;
