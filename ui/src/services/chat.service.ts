import { apiClient } from "@/lib/api-client";
import {
  SendMessageRequest,
  SendMessageResponse,
  StartChatResponse,
  GetChatsResponse,
  GetMessagesResponse,
} from "@/types/chat";

export class ChatService {
  async startNewChat(data: SendMessageRequest): Promise<StartChatResponse> {
    const response = await apiClient.post<StartChatResponse>(
      "/api/v1/chats/new",
      data
    );
    return response.data;
  }

  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await apiClient.post<SendMessageResponse>(
      "/api/v1/chats",
      data
    );
    return response.data;
  }

  async streamMessage(
    data: SendMessageRequest,
    signal?: AbortSignal
  ): Promise<ReadableStream> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post("/api/v1/chats/stream", data, {
      responseType: "stream",
      signal,
    });
    return response.data;
  }

  async getChats(): Promise<GetChatsResponse> {
    const response = await apiClient.get<GetChatsResponse>("/api/v1/chats");
    return response.data;
  }

  async getMessages(chatId: string): Promise<GetMessagesResponse> {
    const response = await apiClient.get<GetMessagesResponse>(
      `/api/v1/chats/${chatId}/messages`
    );
    return response.data;
  }
}

export const chatService = new ChatService();

