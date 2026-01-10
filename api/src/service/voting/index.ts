import type LLMRepository from "@/domain/llm/repository";

export default class VotingService {
  llmRepository: LLMRepository;

  constructor(llmRepository: LLMRepository) {
    this.llmRepository = llmRepository;
  }

  async vote(prompt: string) {
    return await this.llmRepository.vote({
      prompt,
    });
  }
}
