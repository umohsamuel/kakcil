import type LLMRepository from "@/domain/llm/repository";
import type ChatRepository from "@/domain/chat/repository.ts";

export default class ChatService {
  llmRepository: LLMRepository;
  chatRepository: ChatRepository;

  constructor(llmRepository: LLMRepository, chatRepository: ChatRepository) {
    this.llmRepository = llmRepository;
    this.chatRepository = chatRepository;
  }

  async startNewChat(text: string, user_id: string, useFastModel?: boolean) {
    const voteResponse = await this.llmRepository.vote({
      prompt: text,
    });

    const chat = await this.chatRepository.add({
      model: voteResponse.model,
      user_id,
      title: voteResponse.topic,
      system_prompt: voteResponse.prompt,
    });

    await this.chatRepository.addMessage({
      chat_id: chat.id,
      user_id,
      role: "user",
      content: text,
    });

    await this.chatRepository.addMessage({
      chat_id: chat.id,
      user_id,
      role: "assistant",
      content: voteResponse.response,
      model: voteResponse.model,
    });

    return {
      chat_id: chat.id,
      role: "assistant",
      content: voteResponse.response,
      model: voteResponse.model,
    };
  }

  async sendMessageToChat(
    chat_id: string,
    text: string,
    user_id: string,
    useFastModel?: boolean,
  ) {
    const messages = await this.chatRepository.getMessages(chat_id);

    const response = await this.llmRepository.vote({
      prompt: text,
      history: messages,
    });

    await this.chatRepository.addMessage({
      chat_id,
      user_id,
      role: "user",
      content: text,
    });

    await this.chatRepository.addMessage({
      chat_id,
      user_id,
      role: "assistant",
      content: response.response,
      model: response.model,
    });

    return {
      chat_id,
      role: "assistant",
      content: response.response,
      model: response.model,
    };
  }

  async send(
    text: string,
    user_id: string,
    chat_id?: string,
    useFastModel?: boolean,
  ) {
    if (chat_id) {
      return await this.sendMessageToChat(chat_id, text, user_id, useFastModel);
    } else {
      return await this.startNewChat(text, user_id, useFastModel);
    }
  }

  async getChats(user_id: string) {
    return await this.chatRepository.getAll(user_id);
  }

  async getMessages(chat_id: string) {
    return await this.chatRepository.getMessages(chat_id);
  }
}
