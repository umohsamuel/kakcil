import type LLMRepository from "@/domain/llm/repository";
import type ChatRepository from "@/domain/chat/repository.ts";
import type LLMService from "@/service/llm";
import type { PaginationParams } from "@/infrastructure/utils/pagination.ts";

export default class ChatService {
  llmRepository: LLMRepository;
  chatRepository: ChatRepository;
  llmService: LLMService;

  constructor(
    llmRepository: LLMRepository,
    chatRepository: ChatRepository,
    llmService: LLMService,
  ) {
    this.llmRepository = llmRepository;
    this.chatRepository = chatRepository;
    this.llmService = llmService;
  }

  async getChats(user_id: string, filters: PaginationParams) {
    return await this.chatRepository.getAll(user_id, filters);
  }

  async getMessages(chat_id: string) {
    return await this.chatRepository.getMessages(chat_id);
  }
}
