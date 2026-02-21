import { api } from "@/api/client";
import { AuthResponse, User } from "@/api/types";

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login/json", {
      email,
      password,
    });
    return response.data;
  },

  async register(
    email: string,
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/register", {
      email,
      username,
      password,
    });
    return response.data;
  },

  async me(): Promise<User> {
    const response = await api.get<User>("/api/auth/me");
    return response.data;
  },

  async getGoogleOAuthInfo(): Promise<{ message: string; instructions: string }> {
    const response = await api.get("/api/auth/google");
    return response.data;
  },

  async getGithubOAuthInfo(): Promise<{ message: string; instructions: string }> {
    const response = await api.get("/api/auth/github");
    return response.data;
  },
};
