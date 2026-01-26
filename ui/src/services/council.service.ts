import { apiClient } from "@/lib/api-client";
import {
  GetCouncilMembersResponse,
  GetAvailableModelsResponse,
  UpdateCouncilMembersRequest,
  UpdateCouncilMembersResponse,
} from "@/types/council";

export class CouncilService {
  // Get all available AI models from the backend
  async getAvailableModels(): Promise<GetAvailableModelsResponse> {
    const response = await apiClient.get<GetAvailableModelsResponse>(
      "/api/v1/council"
    );
    return response.data;
  }

  // Get the current user's council members
  async getCouncilMembers(): Promise<GetCouncilMembersResponse> {
    const response = await apiClient.get<GetCouncilMembersResponse>(
      "/api/v1/council/user"
    );
    return response.data;
  }

  async updateCouncilMembers(
    members: string[]
  ): Promise<UpdateCouncilMembersResponse> {
    const response = await apiClient.post<UpdateCouncilMembersResponse>(
      "/api/v1/council/update",
      { members } as UpdateCouncilMembersRequest
    );
    return response.data;
  }

  async clearCouncilMembers(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      "/api/v1/council/clearAll"
    );
    return response.data;
  }
}

export const councilService = new CouncilService();
