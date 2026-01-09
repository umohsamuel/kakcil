import z from "zod";

export interface TextGenerationRequest {
  prompt: string;
  model?: string;
}

export interface TextGenerationResponse {
  text: string;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason: string;
}

export interface VoteRequest {
  prompt: string;
  model: string;
  response: string;
}

export const VoteResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
});
