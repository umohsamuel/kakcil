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
  model?: string;
}
