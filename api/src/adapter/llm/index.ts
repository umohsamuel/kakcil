import {
  createMultiCriteriaVoteSchema,
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
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type LLMRepository from "@/domain/llm/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { getVotingPrompt } from "@/infrastructure/llm/prompts/vote.ts";
import { type LMMScore } from "@/infrastructure/utils/vote.ts";
import type ModelRepository from "@/domain/model/repository.ts";
import type CouncilRepository from "@/domain/council/repository.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";
import type { ModelName } from "@/domain/model/entity.ts";
import type UserApiKeyRepository from "@/domain/user/api_key/repository";
import { decryptApiKey } from "@/infrastructure/utils/encryption";
import { JSON_MODE_PROVIDERS, KIMI_BASE_URL } from "@/infrastructure/model";

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

  private async resolveModel(model_name: ModelName, user_id: string) {
    const provider = this.modelRepository.getProviderByModelName(model_name);

    if (!provider) {
      throw new BadRequestError(`Unsupported model: ${model_name}`);
    }

    const userApiKey = await this.userApiKeyRepository.getActiveKeyByProvider(
      user_id,
      provider,
    );

    if (!userApiKey?.encrypted_key) {
      throw new BadRequestError(
        `No active ${provider} API key. Add one in Settings to use ${model_name}.`,
      );
    }

    const apiKey = decryptApiKey(userApiKey.encrypted_key);
    const jsonMode = JSON_MODE_PROVIDERS.includes(provider);

    switch (provider) {
      case "anthropic":
        return { model: createAnthropic({ apiKey })(model_name), jsonMode };
      case "openai":
        return { model: createOpenAI({ apiKey })(model_name), jsonMode };
      case "google":
        return {
          model: createGoogleGenerativeAI({ apiKey })(model_name),
          jsonMode,
        };
      case "deepseek":
        return { model: createDeepSeek({ apiKey })(model_name), jsonMode };
      case "xai":
        return { model: createXai({ apiKey })(model_name), jsonMode };
      case "kimi":
        return {
          model: createOpenAICompatible({
            name: "kimi",
            apiKey,
            baseURL: KIMI_BASE_URL,
          }).chatModel(model_name),
          jsonMode,
        };
      default:
        throw new BadRequestError(`Unsupported provider: ${provider}`);
    }
  }

  private async jsonInstruction<T>(
    output: Output.Output<T> | undefined,
    jsonMode: boolean,
  ) {
    if (!output || !jsonMode) return undefined;

    const format = await output.responseFormat;
    if (format?.type !== "json" || !format.schema) return undefined;

    return `Respond with only a valid JSON object, no markdown fences, that matches this JSON schema:
${JSON.stringify(format.schema)}`;
  }

  async streamText<T = string>(
    request: TextGenerationRequest,
    user_id: string,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
    onChunk?: (partial: { text?: string; output?: T }) => void,
  ): Promise<TextGenerationResponse<T> | undefined> {
    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const { model, jsonMode } = await this.resolveModel(request.model, user_id);

    const { partialOutputStream } = sdkStreamText({
      model,
      system: await this.jsonInstruction(output, jsonMode),
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
        model: request.model,
        response: lastOutput,
        topic: outputData.topic,
      };
    }
  }

  async generateText<T = string>(
    request: TextGenerationRequest,
    user_id: string,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>> {
    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const { model, jsonMode } = await this.resolveModel(request.model, user_id);

    const result = await sdkGenerateText({
      model,
      system: await this.jsonInstruction(output, jsonMode),
      messages: [
        ...(messageHistory ?? []),
        { role: "user", content: request.prompt },
      ],
      output,
    });

    return {
      prompt: request.prompt,
      model: request.model,
      response: (result.output ?? result.text) as T,
      topic: result.text
        ? undefined
        : (result.output as { topic: string }).topic,
    };
  }

  async vote(
    request: VoteRequest,
    user_id: string,
    llmResponses: TextGenerationResponse[],
    councilMembers: CouncilMember[],
  ): Promise<(LMMScore | null)[]> {
    if (!request || !request.prompt) {
      throw new BadRequestError("vote request is required");
    }

    if (!llmResponses || llmResponses.length < 1) {
      throw new BadRequestError("Failed to get any responses from models");
    }

    const letters = llmResponses.map((_, idx) => String.fromCharCode(65 + idx));
    const votingPrompt = getVotingPrompt(request.prompt, llmResponses);
    const schema = createMultiCriteriaVoteSchema(letters);

    return await Promise.all(
      councilMembers.map(async (member) => {
        try {
          const result = await this.generateText(
            {
              prompt: votingPrompt,
              model: member.model_name,
            },
            user_id,
            Output.object({ schema }),
            request.history,
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
  }
}
