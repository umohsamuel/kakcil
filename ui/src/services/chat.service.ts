import { apiClient } from "@/lib/api-client";
import type { Chat, ChatGraph, ChatListPage } from "@/types/chat";

const CHAT_PAGE_SIZE = 30;

export class ChatService {
  async getChats(page = 1): Promise<ChatListPage> {
    const response = (await apiClient.get<Chat[]>("/api/v1/chats", {
      params: { page, limit: CHAT_PAGE_SIZE },
    })) as { data: Chat[]; metadata?: { page?: number; totalPages?: number } };

    return {
      chats: Array.isArray(response.data) ? response.data : [],
      page: response.metadata?.page ?? page,
      totalPages: response.metadata?.totalPages ?? page,
    };
  }

  async getGraph(chatId: string): Promise<ChatGraph> {
    const response = await apiClient.get<ChatGraph>(
      `/api/v1/chats/${encodeURIComponent(chatId)}/graph`
    );
    return {
      chat: response.data.chat,
      rounds: Array.isArray(response.data.rounds) ? response.data.rounds : [],
      branches: Array.isArray(response.data.branches)
        ? response.data.branches
        : [],
    };
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/api/v1/chats/${encodeURIComponent(chatId)}`
    );
    return response.data;
  }
}

export const chatService = new ChatService();
