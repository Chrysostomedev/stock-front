import axiosInstance from "../../core/axios";
import { UserShopAccess } from "../../types/admin";
import { UserRole } from "../../types/auth";

const UserShopAccessService = {
  /**
   * Assigner un utilisateur à une boutique
   */
  async assignUserToShop(userId: string, shopId: string, roleInShop: UserRole): Promise<UserShopAccess> {
    const response = await axiosInstance.post(`/shops/${shopId}/users/${userId}`, {
      roleInShop,
    });
    return response.data;
  },

  /**
   * Modifier le rôle d'un utilisateur dans une boutique
   */
  async updateUserRole(userId: string, shopId: string, roleInShop: UserRole): Promise<UserShopAccess> {
    const response = await axiosInstance.patch(`/shops/${shopId}/users/${userId}`, {
      roleInShop,
    });
    return response.data;
  },

  /**
   * Retirer un utilisateur d'une boutique
   */
  async removeUserFromShop(userId: string, shopId: string): Promise<void> {
    await axiosInstance.delete(`/shops/${shopId}/users/${userId}`);
  },

  /**
   * Lister les utilisateurs assignés à une boutique
   */
  async listUsersForShop(shopId: string): Promise<UserShopAccess[]> {
    const response = await axiosInstance.get(`/shops/${shopId}/users`);
    return response.data;
  },

  /**
   * Lister les boutiques accessibles par un utilisateur
   */
  async listShopsForUser(userId: string): Promise<UserShopAccess[]> {
    const response = await axiosInstance.get(`/users/${userId}/shops`);
    return response.data;
  },
};

export default UserShopAccessService;
