/**
 * Types for SSE Stream state management
 */
import type { Node, Edge } from "reactflow";
import type { ModelNode, VoteResponseEvent } from "@/types/chat";

/**
 * Phase of the council streaming process
 */
export type StreamPhase = 
  | "idle"
  | "prompting"
  | "voting"
  | "aggregation"
  | "complete"
  | "error";

/**
 * Phase metadata for tracking progress
 */
export interface PhaseInfo {
  phase: StreamPhase;
  startedAt: number;
  modelCount?: number;
  completedModels?: string[];
  errorMessage?: string;
}

/**
 * Flow state that persists across navigation
 */
export interface PersistentFlowState {
  nodes: Node[];
  edges: Edge[];
  modelNodes: ModelNode[];
  userMessage: string;
  finalResponse?: VoteResponseEvent;
  conversationRound: number;
}

/**
 * An active SSE stream being tracked globally
 */
export interface ActiveStream {
  /** Unique identifier - chatId or temp ID for new chats */
  streamId: string;
  /** Actual chat ID once received from backend */
  chatId?: string;
  /** Display name for toast (truncated prompt) */
  displayName: string;
  /** Current phase of the council process */
  phaseInfo: PhaseInfo;
  /** Cached canvas state for restoration */
  flowState: PersistentFlowState;
  /** Whether stream is actively receiving data */
  isStreaming: boolean;
  /** Branch ID if this is a branch stream */
  branchId?: string;
  /** Timestamp when stream was started */
  createdAt: number;
}

/**
 * Store state shape
 */
export interface SSEStreamState {
  /** Map of streamId -> ActiveStream */
  streams: Record<string, ActiveStream>;
}

/**
 * Store actions
 */
export interface SSEStreamActions {
  /** Start tracking a new stream */
  startStream: (
    streamId: string,
    message: string,
    existingChatId?: string,
    branchId?: string
  ) => void;
  
  /** Update the phase of a stream */
  updatePhase: (streamId: string, phase: StreamPhase, metadata?: Partial<PhaseInfo>) => void;
  
  /** Update the flow state for a stream */
  updateFlowState: (streamId: string, flowState: Partial<PersistentFlowState>) => void;
  
  /** Set the actual chat ID when received from backend */
  setChatId: (streamId: string, chatId: string) => void;
  
  /** Mark a stream as complete */
  completeStream: (streamId: string) => void;
  
  /** Mark a stream as errored */
  errorStream: (streamId: string, errorMessage: string) => void;
  
  /** Remove a stream (after dismissal or cleanup) */
  removeStream: (streamId: string) => void;
  
  /** Get a stream by ID */
  getStream: (streamId: string) => ActiveStream | undefined;
  
  /** Get stream by chat ID */
  getStreamByChatId: (chatId: string) => ActiveStream | undefined;
  
  /** Check if there's an active stream for a chat */
  hasActiveStream: (chatIdOrStreamId: string) => boolean;
  
  /** Get all active (streaming) streams */
  getActiveStreams: () => ActiveStream[];
}

export type SSEStreamStore = SSEStreamState & SSEStreamActions;
