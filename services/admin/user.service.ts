import { User } from "@/types/auth";
import axiosInstance from "../../core/axios";
import { UserAccount } from "../../types/admin";

const AdminUserService = {
  async getAllUsers(): Promise<UserAccount[]> {
    const response = await axiosInstance.get("/users");
    return response.data;
  },

  async createUser(userData: Partial<UserAccount>): Promise<UserAccount> {
    // On utilise le PIN comme mot de passe initial
    const payload = {
      ...userData,
      passwordHash: userData.pin,
    };
    const response = await axiosInstance.post("/auth/register", payload);
    return response.data.user;
  },
  async getShopAccesses(userId: string): Promise<User[]> {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data.data || response.data;
  },

  async updateUser(id: string, userData: Partial<UserAccount>): Promise<UserAccount> {
    const response = await axiosInstance.patch(`/auth/update/${id}`, userData);
    return response.data;
  },

  async assignShopToUser(userId: string, shopId: string, roleInShop: string): Promise<void> {
    try {
      await axiosInstance.post(`/shops/${shopId}/users/${userId}`, { roleInShop });
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Déjà assigné, on met à jour le rôle
        await axiosInstance.patch(`/shops/${shopId}/users/${userId}`, { roleInShop });
      } else {
        throw error;
      }
    }
  },

  async deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<UserAccount> {
    const response = await axiosInstance.patch(`/auth/update/${id}`, { isActive });
    return response.data;
  }
};

export default AdminUserService;
