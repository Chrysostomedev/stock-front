import axiosInstance from "../core/axios";
import { LoginCredentials, LoginResponse, RegisterDto, User } from "../types/auth";

const AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      return response.data;
    } catch (err: any) {
      // Si 404 (utilisateur introuvable) et qu'un numéro est fourni, tenter la variante avec/sans préfixe +225
      if (err?.response?.status === 404 && credentials.phone) {
        const rawPhone = credentials.phone.trim();
        let altPhone = "";
        if (rawPhone.startsWith("+225")) {
          altPhone = rawPhone.slice(4);
        } else if (rawPhone.startsWith("225")) {
          altPhone = rawPhone.slice(3);
        } else {
          altPhone = `+225${rawPhone}`;
        }

        if (altPhone && altPhone !== rawPhone) {
          try {
            const altResponse = await axiosInstance.post("/auth/login", {
              ...credentials,
              phone: altPhone,
            });
            return altResponse.data;
          } catch {
            // Si l'alternative échoue également, on propage l'erreur originelle
          }
        }
      }
      throw err;
    }
  },
  async register(userData: RegisterDto): Promise<User> {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.warn("Backend logout failed, continuing with local logout", error);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    }
  },

  async refreshToken(userId: string) {
    const response = await axiosInstance.post(`/auth/refresh/${userId}`);
    return response.data;
  },

  /**
   * Mise à jour du profil utilisateur
   * Endpoint: PATCH /auth/update/:id
   * Le backend attend un UserDto (username, name, phone, passwordHash, role, pin, isActive)
   */
  async updateUser(userId: string, data: Partial<{
    username: string;
    name: string;
    phone: string;
    passwordHash: string;
    pin: string;
    role: string;
    isActive: boolean;
  }>) {
    const response = await axiosInstance.patch(`/auth/update/${userId}`, data);
    return response.data;
  },
};

export default AuthService;
