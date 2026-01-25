import { apiClient } from "@/lib/api-client";
import {
  GetCouncilMembersResponse,
  UpdateCouncilMembersRequest,
  UpdateCouncilMembersResponse,
} from "@/types/council";

export class CouncilService {
  async getCouncilMembers(): Promise<GetCouncilMembersResponse> {
    const response = await apiClient.get<GetCouncilMembersResponse>(
      "/api/v1/council"
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
}

export const councilService = new CouncilService();
