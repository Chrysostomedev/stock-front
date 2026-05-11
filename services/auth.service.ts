import axiosInstance from "../core/axios";
import { LoginResponse, User } from "../types/auth";

const AuthService = {
  async login(credentials: any): Promise<LoginResponse> {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  },

  async register(userData: any) {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  async logout() {
    await axiosInstance.post("/auth/logout");
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    }
  },

  async refreshToken(userId: string) {
    const response = await axiosInstance.post(`/auth/refresh/${userId}`);
    return response.data;
  }
};

export default AuthService;
