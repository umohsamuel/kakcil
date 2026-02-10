import { apiClient } from "@/lib/api-client";
import type {
  UserApiKey,
  AddApiKeyRequest,
  UpdateApiKeyRequest,
} from "@/types/api-key";

export class ApiKeyService {
  async getAll(): Promise<UserApiKey[]> {
    const response = await apiClient.get<UserApiKey[]>("/api/v1/api-key");
    return response.data;
  }

  async getById(id: string): Promise<UserApiKey> {
    const response = await apiClient.get<UserApiKey>(`/api/v1/api-key/${id}`);
    return response.data;
  }

  async add(data: AddApiKeyRequest): Promise<UserApiKey> {
    const response = await apiClient.post<UserApiKey>("/api/v1/api-key", data);
    return response.data;
  }

  async update(data: UpdateApiKeyRequest): Promise<UserApiKey> {
    const response = await apiClient.patch<UserApiKey>(
      "/api/v1/api-key/update",
      data,
    );
    return response.data;
  }

  async deleteKey(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/api/v1/api-key/${id}`,
    );
    return response.data;
  }
}

export const apiKeyService = new ApiKeyService();
