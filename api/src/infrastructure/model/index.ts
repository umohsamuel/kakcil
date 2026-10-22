import type { ModelName } from "@/domain/model/entity.ts";

export const MODEL_CONFIGS = {
  anthropic: [
    "claude-opus-5-5",
    "claude-sonnet-5-5",
    "claude-haiku-5-5",
    "claude-fable-5-1",
    "claude-opus-5",
    "claude-sonnet-5",
    "claude-fable-5",
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-opus-4-6",
    "claude-opus-4-5-20251101",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-20251001",
  ] as const,
  openai: [
    "gpt-6.1-sol",
    "gpt-6-sol",
    "gpt-6-luna",
    "gpt-6-astra",
    "gpt-5.6-sol",
    "gpt-5.6-terra",
    "gpt-5.6-luna",
    "gpt-5.5",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-4.1",
    "gpt-4.1-mini",
    "o3",
    "o4-mini",
    "gpt-4o",
    "gpt-4o-mini",
  ] as const,
  google: [
    "gemini-4-argon",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ] as const,
  deepseek: ["deepseek-v4-pro", "deepseek-flash"] as const,
  xai: [
    "grok-4.7",
    "grok-4.6",
    "grok-4.5",
    "grok-4.3",
    "grok-4.20-0309-reasoning",
    "grok-4.20-0309-non-reasoning",
  ] as const,
  kimi: ["kimi-k3", "kimi-k2.6", "kimi-k2.7-code"] as const,
} as const;

export const JSON_MODE_PROVIDERS: readonly string[] = ["deepseek", "kimi"];

export const KIMI_BASE_URL = "https://api.moonshot.ai/v1";

export const DEFAULT_COUNCIL_MODELS = [
  // "claude-haiku-4-5-20251001",
  "gpt-5.4-mini",
  "gemini-3.5-flash-lite",
] as const;

export const DEFAULT_MODEL_BY_PROVIDER = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-5.4-mini",
  google: "gemini-3.5-flash-lite",
  deepseek: "deepseek-flash",
  xai: "grok-4.3",
  kimi: "kimi-k2.6",
} as const;

export const MODEL_DESCRIPTIONS: Record<ModelName, string> = {
  // Anthropic Models
  "claude-opus-5-5": "Claude Opus 5.5, Anthropic's most capable model",
  "claude-sonnet-5-5": "Claude Sonnet 5.5, balanced speed and intelligence",
  "claude-haiku-5-5": "Claude Haiku 5.5, the fastest current Claude model",
  "claude-fable-5-1": "Claude Fable 5.1",
  "claude-opus-5": "Claude Opus 5",
  "claude-sonnet-5": "Claude Sonnet 5",
  "claude-fable-5": "Claude Fable 5",
  "claude-opus-4-8": "Claude Opus 4.8",
  "claude-opus-4-7": "Claude Opus 4.7",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-opus-4-6": "Claude Opus 4.6",
  "claude-opus-4-5-20251101": "Claude Opus 4.5",
  "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5",
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",

  // OpenAI Models
  "gpt-6.1-sol": "GPT-6.1 Sol, OpenAI's newest model",
  "gpt-6-sol": "GPT-6 Sol",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-6-astra": "GPT-6 Astra",
  "gpt-5.6-sol": "GPT-5.6 Sol",
  "gpt-5.6-terra": "GPT-5.6 Terra",
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-5.5": "GPT-5.5",
  "gpt-5.4": "GPT-5.4",
  "gpt-5.4-mini": "GPT-5.4 mini, fast and inexpensive",
  "gpt-5.4-nano": "GPT-5.4 nano, the smallest and cheapest GPT-5.4",
  "gpt-5.2": "GPT-5.2",
  "gpt-5.1": "GPT-5.1",
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5-nano": "GPT-5 nano",
  "gpt-4.1": "GPT-4.1",
  "gpt-4.1-mini": "GPT-4.1 mini",
  o3: "o3 reasoning model",
  "o4-mini": "o4-mini reasoning model",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o mini",

  // Google Models
  "gemini-4-argon": "Gemini 4 Argon, Google's newest model",
  "gemini-3.8-flash": "Gemini 3.8 Flash",
  "gemini-3.7-flash": "Gemini 3.7 Flash",
  "gemini-3.6-flash": "Gemini 3.6 Flash",
  "gemini-3.5-flash": "Gemini 3.5 Flash",
  "gemini-3.5-flash-lite": "Gemini 3.5 Flash-Lite, fast and inexpensive",
  "gemini-3.1-pro-preview": "Gemini 3.1 Pro (preview)",
  "gemini-3.1-flash-lite": "Gemini 3.1 Flash-Lite",
  "gemini-3-flash-preview":
    "Our most balanced model built for speed, scale, and frontier intelligence.",

  "gemini-2.5-flash":
    "Our best model in terms of price-performance, offering well-rounded capabilities. 2.5 Flash is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.",

  "gemini-2.5-flash-lite":
    "Our fastest flash model optimized for cost-efficiency and high throughput.",

  "gemini-2.5-pro":
    "Our state-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.",

  "deepseek-v4-pro": "DeepSeek V4 Pro",
  "deepseek-flash": "DeepSeek Flash (V4.1 Flash), fast and inexpensive",

  "grok-4.7": "Grok 4.7, xAI's most capable model",
  "grok-4.6": "Grok 4.6",
  "grok-4.5": "Grok 4.5",
  "grok-4.3": "Grok 4.3, 1M context at a lower price",
  "grok-4.20-0309-reasoning": "Grok 4.20 with reasoning",
  "grok-4.20-0309-non-reasoning": "Grok 4.20 without reasoning",

  "kimi-k3": "Kimi K3, Moonshot's flagship model",
  "kimi-k2.6": "Kimi K2.6, general purpose",
  "kimi-k2.7-code": "Kimi K2.7 tuned for coding",
};
