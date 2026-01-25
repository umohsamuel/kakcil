import {
  MultiCriteriaVoteSchema,
  type TextGenerationRequest,
  type TextGenerationResponse,
  type VoteRequest,
} from "@/domain/llm/entity";
import { type Pool } from "pg";
import type Secrets from "@/infrastructure/secrets";
import { generateText as sdkGenerateText, Output, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type LLMRepository from "@/domain/llm/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { getVotingPrompt } from "@/infrastructure/llm/prompts/vote.ts";
import { type LMMScore } from "@/infrastructure/utils/vote.ts";
import type ModelRepository from "@/domain/model/repository.ts";
import type CouncilRepository from "@/domain/council/repository.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";

export default class LLMAdapter implements LLMRepository {
  secrets: Secrets;
  pgPool: Pool;
  modelRepository: ModelRepository;
  councilRepository: CouncilRepository;

  constructor(
    pgPool: Pool,
    secrets: Secrets,
    modelRepository: ModelRepository,
    councilRepository: CouncilRepository,
  ) {
    this.modelRepository = modelRepository;
    this.councilRepository = councilRepository;
    this.secrets = secrets;
    this.pgPool = pgPool;
  }

  async generateText<T = string>(
    request: TextGenerationRequest,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>> {
    const provider = this.modelRepository.getProviderByModelName(request.model);

    console.log("inside generate text", request.model, provider);

    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const result = await sdkGenerateText({
      model:
        provider === "anthropic"
          ? anthropic(request.model)
          : provider === "openai"
            ? openai(request.model)
            : google(request.model),
      messages: [
        ...(messageHistory ?? []),
        { role: "user", content: request.prompt },
      ],
      output,
    });

    return {
      prompt: request.prompt,
      model: provider ? request.model : "unknown",
      response: (result.output ?? result.text) as T,
      topic: result.text
        ? undefined
        : (result.output as { topic: string }).topic,
    };
  }

  async vote(
    request: VoteRequest,
    llmResponses: (TextGenerationResponse | null)[],
    councilMembers: CouncilMember[],
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

    console.log("voting in it council members", { councilMembers });

    const llmScores = await Promise.all(
      councilMembers.map(async (member) => {
        try {
          const result = await this.generateText(
            {
              prompt: votingPrompt,
              model: member.model_name,
            },
            Output.object({
              schema: MultiCriteriaVoteSchema,
            }),
            messageHistory,
          );

          return {
            voter: member.model_name,
            scores: result.response.scores,
            reasoning: result.response.reasoning,
            topic: result.response.topic,
          };
        } catch (error) {
          console.error(
            `Error getting scores from ${member.model_name}:`,
            error,
          );

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
