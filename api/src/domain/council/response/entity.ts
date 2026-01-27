export interface ICouncilResponse {
  id: string;
  chat_id: string;
  user_message_id: string;
  model: string;
  provider: string;
  content: string;
  is_winner: boolean;
  votes_received: number;
  created_at: Date;
}

export interface CreateCouncilResponseDTO {
  chat_id: string;
  user_message_id: string;
  model: string;
  provider: string;
  content: string;
  is_winner?: boolean;
  votes_received?: number;
}
