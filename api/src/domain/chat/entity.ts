export interface IChat {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  created_at?: Date;
  updated_at?: Date;
  last_message_at?: Date | null;
}

export interface IChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  model: string | null;
  parent_message_id: string | null;
  branch_from_response_id: string | null;
  branch_id: string | null;
  is_active_branch: boolean;
  created_at?: Date;
}

export interface IChatGraphResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  is_winner: boolean;
  votes_received: number;
}

export interface IChatGraphRound {
  id: string;
  branch_id: string | null;
  prompt: string;
  created_at: Date;
  answer: {
    id: string;
    model: string | null;
    content: string;
  } | null;
  responses: IChatGraphResponse[];
}

export interface IChatGraphBranch {
  id: string;
  branch_name: string | null;
  parent_round_id: string;
  parent_response_id: string;
  created_at: Date;
}

export interface IChatGraph {
  chat: Pick<IChat, "id" | "title" | "created_at" | "last_message_at">;
  rounds: IChatGraphRound[];
  branches: IChatGraphBranch[];
}
