/**
 * Global SSE Chat Hook
 * 
 * This hook integrates with the global SSE stream store to provide
 * persistent streaming state across navigation. It wraps the SSE service
 * and syncs state to the global store.
 */
import { useCallback, useRef, useEffect } from "react";
import { sseService } from "@/services/sse.service";
import { useSSEStreamStore, type StreamPhase, type PersistentFlowState } from "@/store/sse-stream";
import type { LLMResponseEvent, LLMVoteEvent, VoteResponseEvent, ModelNode } from "@/types/chat";

interface UseGlobalSSEChatOptions {
  /** Callback when a new chat is created (receives chatId from backend) */
  onNewChatCreated?: (chatId: string) => void;
  /** Callback when stream completes */
  onComplete?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Generate a temporary stream ID for new chats
 */
function generateStreamId(): string {
  return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useGlobalSSEChat(
  chatId?: string,
  options?: UseGlobalSSEChatOptions
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  // Store actions
  const startStream = useSSEStreamStore((s) => s.startStream);
  const updatePhase = useSSEStreamStore((s) => s.updatePhase);
  const updateFlowState = useSSEStreamStore((s) => s.updateFlowState);
  const setChatId = useSSEStreamStore((s) => s.setChatId);
  const completeStream = useSSEStreamStore((s) => s.completeStream);
  const errorStream = useSSEStreamStore((s) => s.errorStream);
  const getStream = useSSEStreamStore((s) => s.getStream);
  const getStreamByChatId = useSSEStreamStore((s) => s.getStreamByChatId);

  // Get current stream for this chat
  const currentStream = chatId 
    ? getStreamByChatId(chatId) 
    : currentStreamIdRef.current 
      ? getStream(currentStreamIdRef.current)
      : undefined;

  /**
   * Start streaming a message
   */
  const startStreaming = useCallback(
    async (message: string, existingChatId?: string, branchId?: string) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Generate stream ID for tracking
      const streamId = existingChatId || chatId || generateStreamId();
      currentStreamIdRef.current = streamId;

      // Initialize stream in global store
      startStream(streamId, message, existingChatId || chatId, branchId);

      // Track model responses for counting
      const modelNodes: ModelNode[] = [];
      let completedModels: string[] = [];

      const chatIdToUse = existingChatId || chatId;
      const endpoint = chatIdToUse ? "/api/v1/chats" : "/api/v1/chats/new";
      const body = chatIdToUse
        ? { message, chat_id: chatIdToUse, branch_id: branchId }
        : { message };

      try {
        await sseService.createStream(
          endpoint,
          body,
          {
            onLLMResponse: (data: LLMResponseEvent) => {
              // Track completed models
              if (!completedModels.includes(data.model)) {
                completedModels.push(data.model);
              }

              // Update model in our local tracking
              const existingIdx = modelNodes.findIndex((n) => n.model === data.model);
              if (existingIdx >= 0) {
                modelNodes[existingIdx] = {
                  ...modelNodes[existingIdx],
                  status: "completed",
                  response: data.response,
                  topic: data.topic,
                  prompt: data.prompt,
                };
              } else {
                modelNodes.push({
                  model: data.model,
                  status: "completed",
                  response: data.response,
                  topic: data.topic,
                  prompt: data.prompt,
                });
              }

              // Update store with phase info
              updatePhase(streamId, "prompting", {
                modelCount: modelNodes.length,
                completedModels: [...completedModels],
              });

              // Update flow state
              updateFlowState(streamId, {
                modelNodes: [...modelNodes],
              });
            },

            onLLMVote: (data: LLMVoteEvent) => {
              // Transition to voting phase
              updatePhase(streamId, "voting");

              // Update model statuses
              const votingNodes = modelNodes.map((node) => ({
                ...node,
                status: "voting" as const,
              }));

              updateFlowState(streamId, {
                modelNodes: votingNodes,
              });
            },

            onVoteResponse: (data: VoteResponseEvent) => {
              // Brief aggregation phase, then complete
              updatePhase(streamId, "aggregation");

              // Update model statuses with winner
              const finalNodes = modelNodes.map((node) => ({
                ...node,
                status: node.model === data.model 
                  ? ("winner" as const) 
                  : ("completed" as const),
              }));

              updateFlowState(streamId, {
                modelNodes: finalNodes,
                finalResponse: data,
              });

              // Brief delay then complete
              setTimeout(() => {
                completeStream(streamId);
                options?.onComplete?.();
              }, 500);
            },

            onChatId: (data: { chat_id: string }) => {
              // Store the actual chat ID
              setChatId(streamId, data.chat_id);
              options?.onNewChatCreated?.(data.chat_id);
            },

            onError: (data: { error: string }) => {
              errorStream(streamId, data.error);
              options?.onError?.(data.error);
            },

            onComplete: () => {
              // Stream finished (may or may not have completed successfully)
              const stream = getStream(streamId);
              if (stream?.phaseInfo.phase !== "complete" && stream?.phaseInfo.phase !== "error") {
                completeStream(streamId);
              }
            },
          },
          abortControllerRef.current.signal
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          errorStream(streamId, error.message || "Stream failed");
          options?.onError?.(error.message);
        }
      }
    },
    [
      chatId,
      startStream,
      updatePhase,
      updateFlowState,
      setChatId,
      completeStream,
      errorStream,
      getStream,
      options,
    ]
  );

  /**
   * Cancel the current stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (currentStreamIdRef.current) {
      errorStream(currentStreamIdRef.current, "Cancelled by user");
    }
  }, [errorStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't abort on unmount - let stream continue in background
      // The provider will manage the toast
    };
  }, []);

  return {
    /** Current stream state from global store */
    stream: currentStream,
    /** Whether there's an active stream */
    isStreaming: currentStream?.isStreaming ?? false,
    /** Current phase */
    phase: currentStream?.phaseInfo.phase ?? "idle",
    /** Cached flow state from store */
    flowState: currentStream?.flowState,
    /** Start streaming a message */
    startStreaming,
    /** Cancel the current stream */
    cancelStream,
    /** Get the actual chat ID (may differ from stream ID for new chats) */
    getChatId: () => currentStream?.chatId,
  };
}

export default useGlobalSSEChat;
