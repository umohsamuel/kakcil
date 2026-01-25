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

// Available models configuration - should match backend MODEL_CONFIGS
export const MODEL_CONFIGS: Record<AIProvider, readonly string[]> = {
  anthropic: [
    // Anthropic models currently commented out in backend
  ] as const,
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1-mini",
    "o1",
  ] as const,
  google: [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ] as const,
} as const;

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

// Helper to get all available models as a flat array
export function getAllAvailableModels(): Array<{ model: string; provider: AIProvider }> {
  const models: Array<{ model: string; provider: AIProvider }> = [];
  
  for (const [provider, modelList] of Object.entries(MODEL_CONFIGS)) {
    for (const model of modelList) {
      models.push({ model, provider: provider as AIProvider });
    }
  }
  
  return models;
}
