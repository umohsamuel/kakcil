import {
  MultiCriteriaVoteSchema,
  type TextGenerationRequest,
  type TextGenerationResponse,
  type VoteRequest,
} from "@/domain/llm/entity";
import { type Pool } from "pg";
import type Secrets from "@/infrastructure/secrets";
import {
  generateText as sdkGenerateText,
  streamText as sdkStreamText,
  Output,
  type ModelMessage,
} from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import type LLMRepository from "@/domain/llm/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { getVotingPrompt } from "@/infrastructure/llm/prompts/vote.ts";
import { type LMMScore } from "@/infrastructure/utils/vote.ts";
import type ModelRepository from "@/domain/model/repository.ts";
import type CouncilRepository from "@/domain/council/repository.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";
import type UserApiKeyRepository from "@/domain/user/api_key/repository";
import { decryptApiKey } from "@/infrastructure/utils/encryption";

export default class LLMAdapter implements LLMRepository {
  secrets: Secrets;
  pgPool: Pool;
  modelRepository: ModelRepository;
  councilRepository: CouncilRepository;
  userApiKeyRepository: UserApiKeyRepository;

  constructor(
    pgPool: Pool,
    secrets: Secrets,
    modelRepository: ModelRepository,
    councilRepository: CouncilRepository,
    userApiKeyRepository: UserApiKeyRepository,
  ) {
    this.modelRepository = modelRepository;
    this.councilRepository = councilRepository;
    this.secrets = secrets;
    this.pgPool = pgPool;
    this.userApiKeyRepository = userApiKeyRepository;
  }

  async streamText<T = string>(
    request: TextGenerationRequest,
    user_id: string,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
    onChunk?: (partial: { text?: string; output?: T }) => void,
  ): Promise<TextGenerationResponse<T> | undefined> {
    const provider = this.modelRepository.getProviderByModelName(request.model);

    if (!provider) {
      throw new BadRequestError(`Unsupported provider: ${provider}`);
    }

    const userApiKey = await this.userApiKeyRepository.getActiveKeyByProvider(
      user_id,
      provider,
    );

    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    let model;

    if (provider === "anthropic") {
      if (userApiKey?.encrypted_key) {
        const customAnthropic = createAnthropic({
          apiKey: decryptApiKey(userApiKey?.encrypted_key),
        });
        console.log("using custom anthropic");

        model = customAnthropic(request.model);
      } else {
        model = anthropic(request.model);
      }
    } else if (provider === "openai") {
      if (userApiKey?.encrypted_key) {
        const customOpenAI = createOpenAI({
          apiKey: decryptApiKey(userApiKey?.encrypted_key),
        });
        console.log("using custom openai");
        model = customOpenAI(request.model);
      } else {
        model = openai(request.model);
      }
    } else if (provider === "google") {
      if (userApiKey?.encrypted_key) {
        const customGoogle = createGoogleGenerativeAI({
          apiKey: decryptApiKey(userApiKey?.encrypted_key),
        });
        console.log("using custom google");
        model = customGoogle(request.model);
      } else {
        model = google(request.model);
      }
    } else {
      throw new BadRequestError(`Unsupported provider: ${provider}`);
    }

    const { partialOutputStream } = sdkStreamText({
      model,
      messages: [
        ...(messageHistory ?? []),
        { role: "user", content: request.prompt },
      ],
      output,
    });

    let lastOutput: T | null = null;

    for await (const partialObject of partialOutputStream) {
      lastOutput = partialObject as T;

      if (onChunk) {
        const partial = partialObject as { topic?: string; response?: string };
        onChunk({
          text: partial.response,
          output: partialObject as T,
        });
      }
    }

    if (lastOutput) {
      const outputData = lastOutput as { topic?: string; response?: string };

      return {
        prompt: request.prompt,
        model: provider ? request.model : "unknown",
        response: lastOutput,
        topic: outputData.topic,
      };
    }
  }

  async generateText<T = string>(
    request: TextGenerationRequest,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>> {
    const provider = this.modelRepository.getProviderByModelName(request.model);

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

    console.log("voting council members", { councilMembers });

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
