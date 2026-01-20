import {
  MultiCriteriaVoteSchema,
  type TextGenerationRequest,
  type TextGenerationResponse,
  type VoteRequest,
} from "@/domain/llm/entity";
import { type Pool } from "pg";
import type Secrets from "@/infrastructure/secrets";
import { streamText, generateText, Output, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type LLMRepository from "@/domain/llm/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { AIProviders } from "@/infrastructure/utils/ai";
import z from "zod";
import { getVotingPrompt } from "@/infrastructure/llm/prompts/vote.ts";
import type { VoteCriteria } from "@/infrastructure/types/vote.ts";
import { calculateVote, type LMMScore } from "@/infrastructure/utils/vote.ts";

export default class LLMAdapter implements LLMRepository {
  secrets: Secrets;
  pgPool: Pool;

  constructor(pgPool: Pool, secrets: Secrets) {
    this.secrets = secrets;
    this.pgPool = pgPool;
  }

  async generateText<T = string>(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>> {
    const provider = this.secrets.aisdkProvider;

    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const result = await generateText({
      model:
        provider === "google"
          ? google(this.secrets.aiModelConfiguration.google.fastModel)
          : provider === "openai"
            ? openai(this.secrets.aiModelConfiguration.openai.fastModel)
            : anthropic(this.secrets.aiModelConfiguration.anthropic.fastModel),
      messages: [
        ...(messageHistory ?? []),
        { role: "user", content: request.prompt },
      ],
      output,
    });

    return {
      prompt: request.prompt,
      model: provider,
      response: (result.output ?? result.text) as T,
      topic: result.text
        ? undefined
        : (result.output as { topic: string }).topic,
    };
  }

  async *streamText(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    signal?: AbortSignal,
    sdkProvider: string = this.secrets.aisdkProvider,
  ): AsyncGenerator<string> {
    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const result = streamText({
      model:
        sdkProvider === "google"
          ? google(
              (request.model ?? useFastModel)
                ? this.secrets.aiModelConfiguration.google.fastModel
                : this.secrets.aiModelConfiguration.google.model,
            )
          : sdkProvider === "openai"
            ? openai(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.openai.fastModel
                  : this.secrets.aiModelConfiguration.openai.model,
              )
            : anthropic(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.anthropic.fastModel
                  : this.secrets.aiModelConfiguration.anthropic.model,
              ),
      prompt: request.prompt,
      abortSignal: signal,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }

  async vote(
    request: VoteRequest,
    llmResponses: (TextGenerationResponse | null)[],
    useFastModel: boolean = true,
  ): Promise<(LMMScore | null)[]> {
    if (!request || !request.prompt) {
      throw new BadRequestError("vote request is required");
    }

    if (!llmResponses || llmResponses.length < 1) {
      throw new BadRequestError("Failed to get any responses from models");
    }

    const messageHistory = request.history?.map((m) => ({
      role: m.role,
      content: m.content,
    })) as ModelMessage[] | undefined;

    const originalPrompt = request.prompt;

    const votingPrompt = getVotingPrompt(originalPrompt, llmResponses);

    const llmScores = await Promise.all(
      AIProviders.map(async (provider) => {
        try {
          const result = await this.generateText(
            {
              prompt: votingPrompt,
              model: provider,
            },
            useFastModel,
            Output.object({
              schema: MultiCriteriaVoteSchema,
            }),
            messageHistory,
          );

          return {
            voter: provider,
            scores: result.response.scores,
            reasoning: result.response.reasoning,
            topic: result.response.topic,
          };
        } catch (error) {
          console.error(`Error getting scores from ${provider}:`, error);

          return null;
        }
      }),
    );

    console.log("all scores:", JSON.stringify(llmScores, null, 2));

    if (llmScores.length === 0) {
      throw new BadRequestError("Failed to get any scores from models");
    }

    return llmScores;
  }
}
