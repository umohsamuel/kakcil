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

