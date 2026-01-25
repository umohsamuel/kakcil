import z from "zod";
import type { IChatMessage } from "@/domain/chat/entity.ts";
import type { ModelName } from "@/domain/model/entity.ts";

export interface TextGenerationRequest {
  prompt: string;
  model: ModelName;
}

export interface TextGenerationResponse<T = string> {
  prompt: string;
  model: string;
  response: T;
  topic?: string;
}

export interface VoteRequest {
  prompt: string;
  history?: IChatMessage[];
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
  topic: z.string(),
  scores: z.object({
    A: MultiCriteriaScoreSchema,
    B: MultiCriteriaScoreSchema,
    // C: MultiCriteriaScoreSchema,
    // D: MultiCriteriaScoreSchema,
  }),
  reasoning: z.string(),
});
