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
        console.log(" this is a log inside Prompt models, ", { member });
        try {
          const result = await this.llmRepository.generateText<SchemaType>(
            {
              prompt,
              model: member.model_name,
            },
            Output.object({
              schema,
            }),
            messageHistory,
          );

          return {
            prompt,
            model: member.model_name,
            topic: result.response.topic,
            response: result.response.response,
          };
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
}
