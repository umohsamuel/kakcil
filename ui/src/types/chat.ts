export interface Chat {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  chat_id?: string;
  user_id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: Date;
  model?: string;
  isDebating?: boolean;
  councilResponses?: CouncilResponse[];
  votingResults?: VotingResults;
  // Branching support
  parent_message_id?: string | null;
  branch_from_response_id?: string | null;
  branch_id?: string | null;
  is_active_branch?: boolean;
  // Council responses stored in backend
  stored_council_responses?: CouncilResponseData[];
}

// Council response data from backend (stored in database)
export interface CouncilResponseData {
  id: string;
  chat_id: string;
  user_message_id: string;
  model: string;
  provider: string;
  content: string;
  is_winner: boolean;
  votes_received?: number;
  created_at: string;
}

// Chat branch info
export interface ChatBranch {
  id: string;
  chat_id: string;
  branch_name: string | null;
  branched_from_message_id: string | null;
  branched_from_response_id: string | null;
  is_main_branch: boolean;
  created_at: string;
}

// Paginated response wrapper
export interface PaginatedMessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

// Branch request
export interface BranchFromResponseRequest {
  message: string;
  chat_id: string;
  response_id: string;
}

// Branch response
export interface BranchFromResponseResponse {
  branch: ChatBranch;
  assistantMessage: ChatMessage;
  userMessage: ChatMessage;
}

export interface CouncilResponse {
  model: string;
  response: string;
  prompt: string;
}

export interface CriteriaScores {
  accuracy: number;
  completeness: number;
  clarity: number;
  relevance: number;
  conciseness: number;
}

export interface VoterScore {
  voter: string;
  scores: Record<string, CriteriaScores>;
  reasoning?: string;
}

export interface AggregateScore {
  totalScore: number;
  criteriaScores: CriteriaScores;
  voteCount: number;
}

export interface VotingResults {
  allScores: VoterScore[];
  aggregateScores: Map<string, AggregateScore>;
  winningResponse: string;
  winningLetter: string;
}

export interface SendMessageRequest {
  message: string;
  chat_id?: string;
}

export interface SendMessageResponse {
  chat_id: string;
  role: string;
  content: string;
  model: string;
}

export interface StartChatResponse {
  chat_id: string;
  role: string;
  content: string;
  model: string;
}

export type GetChatsResponse = Chat[];
export type GetMessagesResponse = ChatMessage[];

// SSE Event Types
export type SSEEventType = 'llmResponse' | 'llmVote' | 'voteResponse' | 'error';

export interface LLMResponseEvent {
  prompt: string;
  model: string;
  topic: string;
  response: string;
}

export interface LLMVoteEvent {
  voter: string;
  topic: string;
  reasoning: string;
  scores: Record<string, any>;
}

export interface VoteResponseEvent {
  prompt: string;
  model: string;
  topic: string;
  response: string;
}

export interface ErrorEvent {
  error: string;
}

// Canvas Visualization States
export type ModelNodeStatus = 'idle' | 'generating' | 'completed' | 'voting' | 'winner';

export interface ModelNode {
  model: string;
  status: ModelNodeStatus;
  response?: string;
  topic?: string;
  prompt?: string;
  position?: { x: number; y: number };
  votes?: number;
}

export interface ConversationState {
  userMessage: string;
  modelNodes: ModelNode[];
  votingResults: LLMVoteEvent[];
  finalResponse?: VoteResponseEvent;
  isStreaming: boolean;
  error?: string;
}

