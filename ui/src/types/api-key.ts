export type AIProvider = "anthropic" | "openai" | "google";

export const AI_PROVIDERS: readonly AIProvider[] = [
  "anthropic",
  "openai",
  "google",
] as const;

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  google: "Google (Gemini)",
};

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: AIProvider;
  encrypted_key: string;
  is_active: boolean;
  created_at?: string;
}

export interface AddApiKeyRequest {
  provider: AIProvider;
  apiKey: string;
}

export interface UpdateApiKeyRequest {
  id: string;
  is_active?: boolean;
  apiKey?: string;
  provider?: AIProvider;
}
