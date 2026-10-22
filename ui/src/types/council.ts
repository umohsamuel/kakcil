// Council member types for the frontend

import type { AIProvider } from "./api-key";

export type { AIProvider };

export interface CouncilMember {
  id: string;
  user_id: string;
  model_name: string;
  provider: AIProvider;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateCouncilMembersRequest {
  members: string[];
}

export interface UpdateCouncilMembersResponse {
  message: string;
}

export type GetCouncilMembersResponse = CouncilMember[];

// Available model from API
export interface AvailableModel {
  model_name: string;
  provider: AIProvider;
  description?: string;
}

export type GetAvailableModelsResponse = AvailableModel[];
