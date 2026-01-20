import type LLMRepository from "@/domain/llm/repository.ts";
import { AIProviders } from "@/infrastructure/utils/ai.ts";
import { type ModelMessage, Output } from "ai";
import z from "zod";

export default class LLMService {
  llmRepository: LLMRepository;

  constructor(llmRepository: LLMRepository) {
    this.llmRepository = llmRepository;
  }

  async promptModels(
    prompt: string,
    useFastModel?: boolean,
    messageHistory?: ModelMessage[],
  ) {
    const schema = z.object({
      topic: z.string(),
      response: z.string(),
    });

    type SchemaType = z.infer<typeof schema>;

    return await Promise.all(
      AIProviders.map(async (provider) => {
        try {
          const result = await this.llmRepository.generateText<SchemaType>(
            {
              prompt,
              model: provider,
            },
            useFastModel,
            Output.object({
              schema,
            }),
            messageHistory,
          );

          return {
            prompt,
            model: provider,
            topic: result.response.topic,
            response: result.response.response,
          };
        } catch (error) {
          console.error(
            `Error getting prompt response from ${provider}:`,
            error,
          );

          return null;
        }
      }),
    );
  }
}
