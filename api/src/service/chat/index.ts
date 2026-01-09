import type LLMRepository from "@/domain/llm/repository";

export default class ChatService {
  llmRepository: LLMRepository;

  constructor(llmRepository: LLMRepository) {
    this.llmRepository = llmRepository;
  }

  async sendText(text: string, useFastModel?: boolean) {
    return await this.llmRepository.generateText(
      {
        prompt: text,
      },
      useFastModel,
    );
  }

  async streamText(text: string, useFastModel?: boolean, signal?: AbortSignal) {
    return await this.llmRepository.streamText(
      {
        prompt: text,
      },
      useFastModel,
      signal,
    );
  }
}
