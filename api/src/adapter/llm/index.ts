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
    output?: Output.Output,
  ): Promise<TextGenerationResponse> {
    if (!request.prompt) {
      throw new BadRequestError("prompt is required");
    }

    const result = await generateText({
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
      output,
    });

    return {
      text: result.text,
      result: result,
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

  async vote(request: VoteRequest): Promise<{
    prompt: string;
    model: string;
    response: string;
    topic: string;
  }> {
    if (!request || !request.prompt) {
      throw new BadRequestError("vote request is required");
    }

    const messageHistory = request.history?.map((m) => ({
      role: m.role,
      content: m.content,
    })) as ModelMessage[] | undefined;

    const originalPrompt = request.prompt;

    const promptResponse: Array<{
      prompt: string;
      model: string;
      response: string;
      topic: string;
    }> = [];

    await Promise.all(
      AIProviders.map(async (provider) => {
        try {
          const result = await generateText({
            model:
              provider === "google"
                ? google(this.secrets.aiModelConfiguration.google.fastModel)
                : provider === "openai"
                  ? openai(this.secrets.aiModelConfiguration.openai.fastModel)
                  : anthropic(
                      this.secrets.aiModelConfiguration.anthropic.fastModel,
                    ),
            messages: [
              ...(messageHistory ?? []),
              { role: "user", content: originalPrompt },
            ],
            output: Output.object({
              schema: z.object({
                topic: z.string(),
                response: z.string(),
              }),
            }),
          });

          promptResponse.push({
            prompt: originalPrompt,
            model: provider,
            response: result.output.response,
            topic: result.output.topic,
          });
        } catch (error) {
          console.error(
            `Error getting prompt response from ${provider}:`,
            error,
          );
        }
      }),
    );

    console.log("model responses: ", { promptResponse });

    if (promptResponse.length === 0) {
      throw new BadRequestError("Failed to get any responses from models");
    }

    const votingPrompt = `
You are evaluating multiple AI-generated responses to the same prompt. Rate each response objectively using these criteria on a scale of 1-10:

1. **Accuracy**: Is the information factually correct and reliable?
2. **Completeness**: Does it fully address all aspects of the question?
3. **Clarity**: Is it easy to understand and well-structured?
4. **Relevance**: Does it stay on topic and answer what was asked?
5. **Conciseness**: Is it appropriately brief without unnecessary information?

Original Prompt:
${originalPrompt}

Responses to evaluate:
${promptResponse
  .map(
    (r, idx) => `
Response ${String.fromCharCode(65 + idx)}:
${r.response}
`,
  )
  .join("\n---\n")}

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "scores": {
    "A": { "accuracy": 8, "completeness": 7, "clarity": 9, "relevance": 8, "conciseness": 7 },
    "B": { "accuracy": 9, "completeness": 8, "clarity": 8, "relevance": 9, "conciseness": 8 },
    "C": { "accuracy": 7, "completeness": 9, "clarity": 7, "relevance": 8, "conciseness": 6 }
  },
  "reasoning": "Brief explanation of your evaluation"
}
`;

    const allScores: Array<{
      voter: string;
      scores: Record<
        string,
        {
          accuracy: number;
          completeness: number;
          clarity: number;
          relevance: number;
          conciseness: number;
        }
      >;
      reasoning: string;
      topic: string;
    }> = [];

    await Promise.all(
      AIProviders.map(async (provider) => {
        try {
          const { output } = await generateText({
            model:
              provider === "google"
                ? google(this.secrets.aiModelConfiguration.google.fastModel)
                : provider === "openai"
                  ? openai(this.secrets.aiModelConfiguration.openai.fastModel)
                  : anthropic(
                      this.secrets.aiModelConfiguration.anthropic.fastModel,
                    ),

            prompt: votingPrompt,
            output: Output.object({
              schema: MultiCriteriaVoteSchema,
            }),
          });

          allScores.push({
            voter: provider,
            scores: output.scores,
            reasoning: output.reasoning,
            topic: output.topic,
          });
        } catch (error) {
          console.error(`Error getting scores from ${provider}:`, error);
        }
      }),
    );

    console.log("all scores:", JSON.stringify(allScores, null, 2));

    if (allScores.length === 0) {
      throw new BadRequestError("Failed to get any scores from models");
    }

    const aggregateScores = new Map<
      string,
      {
        totalScore: number;
        criteriaScores: {
          accuracy: number;
          completeness: number;
          clarity: number;
          relevance: number;
          conciseness: number;
        };
        voteCount: number;
      }
    >();

    promptResponse.forEach((_, idx) => {
      const letter = String.fromCharCode(65 + idx);
      aggregateScores.set(letter, {
        totalScore: 0,
        criteriaScores: {
          accuracy: 0,
          completeness: 0,
          clarity: 0,
          relevance: 0,
          conciseness: 0,
        },
        voteCount: 0,
      });
    });

    allScores.forEach((vote) => {
      Object.entries(vote.scores).forEach(([letter, scores]) => {
        const current = aggregateScores.get(letter);
        if (current) {
          current.criteriaScores.accuracy += scores.accuracy;
          current.criteriaScores.completeness += scores.completeness;
          current.criteriaScores.clarity += scores.clarity;
          current.criteriaScores.relevance += scores.relevance;
          current.criteriaScores.conciseness += scores.conciseness;
          current.voteCount++;
        }
      });
    });

    aggregateScores.forEach((score) => {
      if (score.voteCount > 0) {
        Object.keys(score.criteriaScores).forEach((criterion) => {
          score.criteriaScores[
            criterion as keyof typeof score.criteriaScores
          ] /= score.voteCount;
        });

        score.totalScore =
          score.criteriaScores.accuracy * 0.25 +
          score.criteriaScores.completeness * 0.25 +
          score.criteriaScores.clarity * 0.2 +
          score.criteriaScores.relevance * 0.2 +
          score.criteriaScores.conciseness * 0.1;
      }
    });

    console.log(
      "aggregate scores:",
      JSON.stringify(Array.from(aggregateScores.entries()), null, 2),
    );

    let winningLetter = "";
    let highestScore = 0;

    aggregateScores.forEach((score, letter) => {
      if (score.totalScore > highestScore) {
        highestScore = score.totalScore;
        winningLetter = letter;
      }
    });

    const winningIndex = winningLetter.charCodeAt(0) - 65;
    const winningResponse = promptResponse[winningIndex];

    if (!winningResponse) {
      return promptResponse[0]!;
    }

    console.log("winning response ", { winningResponse });
    console.log("winning score:", highestScore.toFixed(2));
    console.log("detailed scores:", aggregateScores.get(winningLetter));

    return winningResponse;
  }
}
