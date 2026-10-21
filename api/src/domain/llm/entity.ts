import z from "zod";
import type { ModelMessage } from "ai";
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
  history?: ModelMessage[];
}

export const VoteResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
});

const score = () => z.number().describe("Score from 1 to 10");

export const MultiCriteriaScoreSchema = z.object({
  accuracy: score(),
  completeness: score(),
  clarity: score(),
  relevance: score(),
  conciseness: score(),
});

export const createMultiCriteriaVoteSchema = (letters: string[]) =>
  z.object({
    topic: z.string(),
    scores: z.object(
      Object.fromEntries(
        letters.map((letter) => [letter, MultiCriteriaScoreSchema]),
      ),
    ),
    reasoning: z.string(),
  });
