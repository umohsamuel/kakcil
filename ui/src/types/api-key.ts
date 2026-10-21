export type AIProvider = "anthropic" | "openai" | "google";

export const AI_PROVIDERS: readonly AIProvider[] = [
  "openai",
  "anthropic",
  "google",
] as const;

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

export const PROVIDER_KEY_PLACEHOLDERS: Record<AIProvider, string> = {
  anthropic: "sk-ant-…",
  openai: "sk-…",
  google: "AIza…",
};

export const PROVIDER_KEY_URLS: Record<AIProvider, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  google: "https://aistudio.google.com/app/apikey",
};

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: AIProvider;
  key_hint: string;
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
}
