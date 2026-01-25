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
  "gemini-3-pro-preview":
    "The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity, all built on a foundation of state-of-the-art reasoning.",

  "gemini-3-flash-preview":
    "Our most balanced model built for speed, scale, and frontier intelligence.",

  "gemini-2.5-flash":
    "Our best model in terms of price-performance, offering well-rounded capabilities. 2.5 Flash is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.",

  "gemini-2.5-flash-lite":
    "Our fastest flash model optimized for cost-efficiency and high throughput.",

  "gemini-2.5-pro":
    "Our state-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.",

  "gemini-2.0-flash":
    "Gemini 2.0 Flash is deprecated and will be shut down on March 31, 2026.",

  "gemini-2.0-flash-lite":
    "Gemini 2.0 Flash-Lite is deprecated and will be shut down on March 31, 2026.",
};
