// Council member types for the frontend

export type AIProvider = 'anthropic' | 'openai' | 'google';

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

// Model descriptions for display (can be overridden by API)
export const MODEL_DESCRIPTIONS: Record<string, string> = {
  // OpenAI Models
  "gpt-4o": "Most capable multimodal GPT model",
  "gpt-4o-mini": "Fast and cost-effective GPT model",
  "gpt-4-turbo": "Enhanced GPT-4 with improved performance",
  "gpt-4": "Original GPT-4 with strong reasoning",
  "o1": "Advanced reasoning model for complex problems",
  "o1-mini": "Faster reasoning model for STEM tasks",
  "gpt-3.5-turbo": "Cost-effective model for general use",

  // Google Models
  "gemini-3-pro-preview": "Next-gen Gemini Pro model",
  "gemini-3-flash-preview": "Next-gen Gemini Flash model",
  "gemini-2.5-flash": "Fast and efficient Gemini 2.5",
  "gemini-2.5-flash-lite": "Lightweight Gemini 2.5 Flash",
  "gemini-2.5-pro": "Advanced Gemini 2.5 Pro",
  "gemini-2.0-flash": "Stable Gemini 2.0 Flash",
  "gemini-2.0-flash-lite": "Lightweight Gemini 2.0",
};
