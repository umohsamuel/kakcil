import { apiClient } from "@/lib/api-client";
import { User, AddUserParams, UpdateUserParams } from "@/types/user";

export class UserService {
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>("/api/v1/users");
    return response.data.users;
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(
      `/api/v1/users/id/${id}`
    );
    return response.data.user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(
      `/api/v1/users/email/${email}`
    );
    return response.data.user;
  }

  async createUser(data: AddUserParams): Promise<User> {
    const response = await apiClient.post<{ user: User }>(
      "/api/v1/users",
      data
    );
    return response.data.user;
  }

  async updateUser(data: UpdateUserParams): Promise<User> {
    const response = await apiClient.patch<{ user: User }>(
      "/api/v1/users/update",
      data
    );
    return response.data.user;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/api/v1/users/delete/${id}`
    );
    return response.data;
  }
}

export const userService = new UserService();

