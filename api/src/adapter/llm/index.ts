import type {
  TextGenerationRequest,
  TextGenerationResponse,
  VoteRequest,
} from "@/domain/llm/entity";
import { type Pool } from "pg";
import type Secrets from "@/infrastructure/secrets";
import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type LLMRepository from "@/domain/llm/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";

export default class LLMAdapter implements LLMRepository {
  secrets: Secrets;
  pgPool: Pool;

  constructor(pgPool: Pool, secrets: Secrets) {
    this.secrets = secrets;
    this.pgPool = pgPool;
  }

  async generateText(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    sdkProvider: string = this.secrets.aisdkProvider,
  ): Promise<TextGenerationResponse> {
    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const result = await generateText({
      model:
        sdkProvider === "google"
          ? google(
              (request.model ?? useFastModel)
                ? this.secrets.aiModelConfiguration.fastModel
                : this.secrets.aiModelConfiguration.model,
            )
          : sdkProvider === "openai"
            ? openai(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.fastModel
                  : this.secrets.aiModelConfiguration.model,
              )
            : anthropic(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.fastModel
                  : this.secrets.aiModelConfiguration.model,
              ),
      prompt: request.prompt,
    });

    return {
      text: result.text,
      usage: {
        promptTokens: result.usage.inputTokens,
        completionTokens: result.usage.outputTokenDetails.reasoningTokens,
        totalTokens: result.usage.totalTokens,
      },
      finishReason: result.finishReason,
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
                ? this.secrets.aiModelConfiguration.fastModel
                : this.secrets.aiModelConfiguration.model,
            )
          : sdkProvider === "openai"
            ? openai(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.fastModel
                  : this.secrets.aiModelConfiguration.model,
              )
            : anthropic(
                (request.model ?? useFastModel)
                  ? this.secrets.aiModelConfiguration.fastModel
                  : this.secrets.aiModelConfiguration.model,
              ),
      prompt: request.prompt,
      abortSignal: signal,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }

  async vote(request: VoteRequest[]): Promise<TextGenerationResponse> {
    if (!request || request.length === 0) {
      throw new BadRequestError("vote requests are required");
    }

    const originalPrompt = request[0].prompt;

    // Prepare voting prompt with all responses
    const votingPrompt = `
You are evaluating multiple AI-generated responses to the same prompt. Your task is to vote for the BEST response based on accuracy, helpfulness, clarity, and relevance.

Original Prompt:
${originalPrompt}

Responses to evaluate:
${request
  .map(
    (r, idx) => `
Response ${idx + 1} (from ${r.model}):
${r.response}
`,
  )
  .join("\n---\n")}

Analyze each response carefully and vote for the best one. Respond ONLY with a JSON object in this exact format:
{
  "model": "the model name of the best response",
  "response": "the full text of the best response"
}

Do not include any explanation or additional text outside the JSON object.
`;

    const providers = ["google", "openai", "anthropic"];
    const votes: Array<{ model: string; response: string }> = [];

    await Promise.all(
      providers.map(async (provider) => {
        try {
          const result = await this.generateText(
            { prompt: votingPrompt },
            true, // use fast model for voting
            provider,
          );

          // Parse the JSON response
          const cleanedText = result.text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          const parsed = VoteResponseSchema.parse(JSON.parse(cleanedText));
          votes.push(parsed);
        } catch (error) {
          console.error(`Error getting vote from ${provider}:`, error);
        }
      }),
    );

    if (votes.length === 0) {
      throw new BadRequestError("Failed to get any votes from models");
    }

    // Count votes for each model/response combination
    const voteCount = new Map<
      string,
      { count: number; response: string; model: string }
    >();

    votes.forEach((vote) => {
      const key = `${vote.model}:${vote.response.substring(0, 100)}`; // Use substring to create unique key
      const existing = voteCount.get(key);

      if (existing) {
        existing.count++;
      } else {
        voteCount.set(key, {
          count: 1,
          response: vote.response,
          model: vote.model,
        });
      }
    });

    // Find the response with most votes
    let winningVote = { count: 0, response: "", model: "" };

    voteCount.forEach((vote) => {
      if (vote.count > winningVote.count) {
        winningVote = vote;
      }
    });

    // If there's a tie, use the first response from the original request
    if (winningVote.count === 0) {
      winningVote = {
        count: 1,
        response: request[0].response,
        model: request[0].model,
      };
    }

    return {
      text: winningVote.response,
      usage: {
        promptTokens: votes.length * 500, // Approximate
        completionTokens: votes.length * 100, // Approximate
        totalTokens: votes.length * 600, // Approximate
      },
      finishReason: "stop",
    };
  }
}
