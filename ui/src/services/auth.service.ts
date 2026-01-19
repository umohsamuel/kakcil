import { apiClient } from "@/lib/api-client";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenResponse,
  LogoutResponse,
} from "@/types/auth";
import { User } from "@/types/user";

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>("/auth/register", data);
    return response.data;
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await apiClient.get<RefreshTokenResponse>(
      "/auth/token/refresh"
    );
    return response.data;
  }

  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.get<LogoutResponse>("/auth/token/clear");
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/forgotPassword",
      { email }
    );
    return response.data;
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/resetPassword",
      { token, password }
    );
    return response.data;
  }
}

export const authService = new AuthService();

