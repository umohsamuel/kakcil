export interface Chat {
  id: string;
  user_id: string;
  title: string | null;
  created_at?: string;
  last_message_at?: string | null;
}

export interface ChatListPage {
  chats: Chat[];
  page: number;
  totalPages: number;
}

export interface ChatGraphResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  is_winner: boolean;
  votes_received: number;
}

export interface ChatGraphRound {
  id: string;
  branch_id: string | null;
  prompt: string;
  created_at: string;
  answer: {
    id: string;
    model: string | null;
    content: string;
  } | null;
  responses: ChatGraphResponse[];
}

export interface ChatGraphBranch {
  id: string;
  branch_name: string | null;
  parent_round_id: string;
  parent_response_id: string;
  created_at: string;
}

export interface ChatGraph {
  chat: {
    id: string;
    title: string | null;
    created_at?: string;
    last_message_at?: string | null;
  };
  rounds: ChatGraphRound[];
  branches: ChatGraphBranch[];
}

export type ModelStatus =
  | "generating"
  | "completed"
  | "voting"
  | "winner"
  | "failed";

export type ComposerTarget =
  | { kind: "thread"; branchId: string | null }
  | {
      kind: "branch";
      responseId: string;
      roundId: string;
      model: string;
    };

export interface CouncilStartEvent {
  models: string[];
}

export interface CouncilPartialEvent {
  model: string;
  partial: string;
  topic?: string;
}

export interface CouncilResponseEvent {
  prompt: string;
  model: string;
  topic: string;
  response: string;
}

export interface CouncilModelErrorEvent {
  model: string;
  error: string;
}

export interface CouncilVoteResultEvent {
  prompt: string;
  model: string;
  topic?: string;
  response: string;
  votes: Record<string, number>;
}

export interface CouncilBranchEvent {
  id: string;
  branch_name: string | null;
  parent_response_id: string;
}

export interface CouncilSavedEvent {
  chat_id: string;
  branch_id: string | null;
  round_id: string;
}
