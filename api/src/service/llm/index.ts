import type LLMRepository from "@/domain/llm/repository.ts";
import { type ModelMessage, Output } from "ai";
import z from "zod";
import type { CouncilMember } from "@/domain/council/entity.ts";

const PARTIAL_INTERVAL_MS = 80;

export type CouncilResponse = {
  prompt: string;
  model: string;
  topic: string;
  response: string;
};

export default class LLMService {
  llmRepository: LLMRepository;

  constructor(llmRepository: LLMRepository) {
    this.llmRepository = llmRepository;
  }

  async streamPromptModels(
    prompt: string,
    user_id: string,
    councilMembers: CouncilMember[],
    messageHistory: ModelMessage[] | undefined,
    callbacks: {
      onPartial: (model: string, partial: string, topic?: string) => void;
      onComplete: (response: CouncilResponse) => void;
      onError: (model: string, error: string) => void;
    },
  ): Promise<Array<CouncilResponse | null>> {
    const schema = z.object({
      topic: z.string(),
      response: z.string(),
    });

    type SchemaType = z.infer<typeof schema>;

    return await Promise.all(
      councilMembers.map(async (member) => {
        let lastSentAt = 0;

        try {
          const result = await this.llmRepository.streamText<SchemaType>(
            {
              prompt,
              model: member.model_name,
            },
            user_id,
            Output.object({
              schema,
            }),
            messageHistory,
            (partial) => {
              const now = Date.now();
              if (now - lastSentAt < PARTIAL_INTERVAL_MS) return;
              lastSentAt = now;

              if (partial.output) {
                callbacks.onPartial(
                  member.model_name,
                  partial.output.response || "",
                  partial.output.topic,
                );
              } else if (partial.text) {
                callbacks.onPartial(member.model_name, partial.text);
              }
            },
          );

          if (result && result.response?.response) {
            const response = {
              prompt,
              model: member.model_name,
              topic: result.response.topic,
              response: result.response.response,
            };
            callbacks.onComplete(response);
            return response;
          }

          callbacks.onError(member.model_name, "No response received");
          return null;
        } catch (error) {
          console.error(
            `Error getting prompt response from ${member.model_name}:`,
            error,
          );
          callbacks.onError(
            member.model_name,
            (error as Error).message || "Unknown error",
          );
          return null;
        }
      }),
    );
  }
}
