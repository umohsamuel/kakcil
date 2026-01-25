import type { ModelName } from "@/domain/model/entity.ts";

export const MODEL_CONFIGS = {
  anthropic: [
    // "claude-opus-4-5-20251101",
    // "claude-sonnet-4-5-20250929",
    // "claude-haiku-4-5-20251001",
    // "claude-3-5-sonnet-20241022",
    // "claude-3-5-haiku-20241022",
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

export const DEFAULT_COUNCIL_MODELS = [
  // "claude-haiku-4-5-20251001",
  "gpt-4o-mini",
  "gemini-2.0-flash-lite",
] as const;

export const MODEL_DESCRIPTIONS: Record<ModelName, string> = {
  // Anthropic Models
  // "claude-opus-4-5-20251101": "Most intelligent Claude model for complex tasks",
  // "claude-sonnet-4-5-20250929": "Balanced model for everyday tasks",
  // "claude-haiku-4-5-20251001": "Fastest Claude model for quick responses",
  // "claude-3-5-sonnet-20241022": "Previous generation balanced model",
  // "claude-3-5-haiku-20241022": "Previous generation fast model",

  // OpenAI Models
  "gpt-4o": "Most capable multimodal GPT model",
  "gpt-4o-mini": "Fast and cost-effective GPT model",
  "gpt-4-turbo": "Enhanced GPT-4 with improved performance",
  "gpt-4": "Original GPT-4 with strong reasoning",
  o1: "Advanced reasoning model for complex problems",
  "o1-mini": "Faster reasoning model for STEM tasks",
  "gpt-3.5-turbo": "Cost-effective model for general use",

  // Google Models
  "gemini-2.0-flash-exp": "Experimental next-gen Gemini model",
  "gemini-1.5-pro": "Advanced Gemini with large context window",
  "gemini-1.5-flash": "Fast and efficient Gemini model",
  "gemini-1.0-pro": "Stable Gemini for general tasks",
};
