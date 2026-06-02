import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { UserShopAccess } from "../../types/admin";
import { UserRole } from "../../types/auth";

const UserShopAccessService = {
  /**
   * Assigner un utilisateur à une boutique
   */
  async assignUserToShop(userId: string, shopId: string, roleInShop: UserRole): Promise<UserShopAccess> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "CREATE",
      payload: { _type: "UserShopAccess", userId, shopId, roleInShop },
      apiCall: () =>
        axiosInstance
          .post(`/shops/${shopId}/users/${userId}`, { roleInShop })
          .then((r) => r.data),
      optimisticResult: { userId, shopId, roleInShop } as UserShopAccess,
    });
  },

  /**
   * Modifier le rôle d'un utilisateur dans une boutique
   */
  async updateUserRole(userId: string, shopId: string, roleInShop: UserRole): Promise<UserShopAccess> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "UserShopAccess", userId, shopId, roleInShop },
      apiCall: () =>
        axiosInstance
          .patch(`/shops/${shopId}/users/${userId}`, { roleInShop })
          .then((r) => r.data),
      optimisticResult: { userId, shopId, roleInShop } as UserShopAccess,
    });
  },

  /**
   * Retirer un utilisateur d'une boutique
   */
  async removeUserFromShop(userId: string, shopId: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "UserShopAccess", userId, shopId },
      apiCall: () => axiosInstance.delete(`/shops/${shopId}/users/${userId}`).then((r) => r.data),
      optimisticResult: undefined,
    });
  },

  /**
   * Lister les utilisateurs assignés à une boutique
   */
  async listUsersForShop(shopId: string): Promise<UserShopAccess[]> {
    return withOfflineCache(
      `user_shop_accesses_shop_${shopId}`,
      () => axiosInstance.get(`/shops/${shopId}/users`).then((r) => r.data),
      []
    );
  },

  /**
   * Lister les boutiques accessibles par un utilisateur
   */
  async listShopsForUser(userId: string): Promise<UserShopAccess[]> {
    return withOfflineCache(
      `user_shop_accesses_user_${userId}`,
      () => axiosInstance.get(`/users/${userId}/shops`).then((r) => r.data),
      []
    );
  },
};

export default UserShopAccessService;
