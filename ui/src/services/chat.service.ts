import { apiClient } from "@/lib/api-client";
import {
  SendMessageRequest,
  SendMessageResponse,
  StartChatResponse,
  GetChatsResponse,
  GetMessagesResponse,
  BranchFromResponseRequest,
  BranchFromResponseResponse,
  CouncilResponseData,
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

  async getMessages(
    chatId: string,
    limit?: number,
    offset?: number,
    branchId?: string
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", limit.toString());
    if (offset !== undefined) params.append("offset", offset.toString());
    if (branchId) params.append("branch_id", branchId);

    const queryString = params.toString();
    const url = `/api/v1/chats/${chatId}/messages${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get<GetMessagesResponse>(url);
    return response.data;
  }

  // Branch from a council response
  async branchFromResponse(
    data: BranchFromResponseRequest
  ): Promise<BranchFromResponseResponse> {
    const response = await apiClient.post<BranchFromResponseResponse>(
      "/api/v1/chats/branch",
      data
    );
    return response.data;
  }

  // Get council responses for a specific user message
  async getCouncilResponses(
    chatId: string,
    messageId: string
  ): Promise<CouncilResponseData[]> {
    const response = await apiClient.get<CouncilResponseData[]>(
      `/api/v1/chats/${chatId}/messages/${messageId}/council-responses`
    );
    return response.data;
  }
}

export const chatService = new ChatService();

