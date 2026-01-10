import type { GenerateTextResult, ToolSet } from "ai";
import z from "zod";

export interface TextGenerationRequest {
  prompt: string;
  model?: string;
}

export interface TextGenerationResponse {
  text: string;
  result: GenerateTextResult<ToolSet, any>;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason: string;
}

export interface VoteRequest {
  prompt: string;
}

export const VoteResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
});

export const MultiCriteriaScoreSchema = z.object({
  accuracy: z.number().min(1).max(10),
  completeness: z.number().min(1).max(10),
  clarity: z.number().min(1).max(10),
  relevance: z.number().min(1).max(10),
  conciseness: z.number().min(1).max(10),
});

export const MultiCriteriaVoteSchema = z.object({
  scores: z.object({
    A: MultiCriteriaScoreSchema,
    B: MultiCriteriaScoreSchema,
    // C: MultiCriteriaScoreSchema,
    // D: MultiCriteriaScoreSchema,
  }),
  reasoning: z.string(),
});

// export const VoteSchema = z.object({
//   winner: z.string(),
//   reasoning: z.string(),
// });
