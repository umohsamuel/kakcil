export interface IChat {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  model: string;
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
}
