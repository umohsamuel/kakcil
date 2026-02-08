import type LLMRepository from "@/domain/llm/repository.ts";
import { type ModelMessage, Output } from "ai";
import z from "zod";
import type { CouncilMember } from "@/domain/council/entity.ts";

export default class LLMService {
  llmRepository: LLMRepository;

  constructor(llmRepository: LLMRepository) {
    this.llmRepository = llmRepository;
  }

  async promptModels(
    prompt: string,
    user_id: string,
    councilMembers: CouncilMember[],
    messageHistory?: ModelMessage[],
  ) {
    const schema = z.object({
      topic: z.string(),
      response: z.string(),
    });

    type SchemaType = z.infer<typeof schema>;

    return await Promise.all(
      councilMembers.map(async (member) => {
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
          );

          if (result) {
            return {
              prompt,
              model: member.model_name,
              topic: result.response.topic,
              response: result.response.response,
            };
          } else return null;
        } catch (error) {
          console.error(
            `Error getting prompt response from ${member.model_name}:`,
            error,
          );

          return null;
        }
      }),
    );
  }

  /**
   * Stream prompt responses from all models with callbacks for partial updates
   */
  async streamPromptModels(
    prompt: string,
    user_id: string,
    councilMembers: CouncilMember[],
    messageHistory: ModelMessage[] | undefined,
    callbacks: {
      onPartial: (model: string, partial: string, topic?: string) => void;
      onComplete: (response: {
        prompt: string;
        model: string;
        topic: string;
        response: string;
      }) => void;
      onError: (model: string, error: string) => void;
    },
  ): Promise<
    Array<{
      prompt: string;
      model: string;
      topic: string;
      response: string;
    } | null>
  > {
    const schema = z.object({
      topic: z.string(),
      response: z.string(),
    });

    type SchemaType = z.infer<typeof schema>;

    const results = await Promise.all(
      councilMembers.map(async (member) => {
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
            // onChunk callback - called for each partial update
            (partial) => {
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

          if (result && result.response) {
            // result.response is the structured object {topic, response}
            const responseData = result.response as {
              topic: string;
              response: string;
            };
            const response = {
              prompt,
              model: member.model_name,
              topic: responseData.topic,
              response: responseData.response,
            };
            callbacks.onComplete(response);
            return response;
          } else {
            console.error(`No response from ${member.model_name}:`, result);
            callbacks.onError(member.model_name, "No response received");
            return null;
          }
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

    return results;
  }
}
