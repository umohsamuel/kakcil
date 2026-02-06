/**
 * SSE Stream Store - Manages global state for all active SSE streams
 * 
 * This allows streams to persist across page navigation and supports
 * parallel streaming for multiple chats.
 */
import { create } from "zustand";
import type { 
  SSEStreamStore, 
  ActiveStream, 
  StreamPhase, 
  PhaseInfo,
  PersistentFlowState 
} from "./types";

/**
 * Generate a display name from a message (truncated)
 */
function truncateMessage(message: string, maxLength = 40): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + "...";
}

/**
 * Create initial phase info
 */
function createPhaseInfo(phase: StreamPhase = "idle"): PhaseInfo {
  return {
    phase,
    startedAt: Date.now(),
  };
}

/**
 * Create initial flow state
 */
function createInitialFlowState(message: string): PersistentFlowState {
  return {
    nodes: [],
    edges: [],
    modelNodes: [],
    userMessage: message,
    conversationRound: 0,
  };
}

export const useSSEStreamStore = create<SSEStreamStore>((set, get) => ({
  // State
  streams: {},

  // Actions
  startStream: (streamId, message, existingChatId, branchId) => {
    set((state) => ({
      streams: {
        ...state.streams,
        [streamId]: {
          streamId,
          chatId: existingChatId,
          displayName: truncateMessage(message),
          phaseInfo: createPhaseInfo("prompting"),
          flowState: createInitialFlowState(message),
          isStreaming: true,
          branchId,
          createdAt: Date.now(),
        },
      },
    }));
  },

  updatePhase: (streamId, phase, metadata) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) return state;

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            phaseInfo: {
              ...stream.phaseInfo,
              phase,
              startedAt: Date.now(),
              ...metadata,
            },
          },
        },
      };
    });
  },

  updateFlowState: (streamId, flowState) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) return state;

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            flowState: {
              ...stream.flowState,
              ...flowState,
            },
          },
        },
      };
    });
  },

  setChatId: (streamId, chatId) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) return state;

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            chatId,
          },
        },
      };
    });
  },

  completeStream: (streamId) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) return state;

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            isStreaming: false,
            phaseInfo: {
              ...stream.phaseInfo,
              phase: "complete",
              startedAt: Date.now(),
            },
          },
        },
      };
    });
  },

  errorStream: (streamId, errorMessage) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) return state;

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            isStreaming: false,
            phaseInfo: {
              ...stream.phaseInfo,
              phase: "error",
              startedAt: Date.now(),
              errorMessage,
            },
          },
        },
      };
    });
  },

  removeStream: (streamId) => {
    set((state) => {
      const { [streamId]: removed, ...remaining } = state.streams;
      return { streams: remaining };
    });
  },

  getStream: (streamId) => {
    return get().streams[streamId];
  },

  getStreamByChatId: (chatId) => {
    const streams = Object.values(get().streams);
    return streams.find((s) => s.chatId === chatId || s.streamId === chatId);
  },

  hasActiveStream: (chatIdOrStreamId) => {
    const stream = get().getStream(chatIdOrStreamId) 
      || get().getStreamByChatId(chatIdOrStreamId);
    return stream?.isStreaming ?? false;
  },

  getActiveStreams: () => {
    return Object.values(get().streams).filter((s) => s.isStreaming);
  },
}));
