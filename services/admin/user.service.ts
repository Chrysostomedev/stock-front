/**
 * admin/user.service.ts — Utilisateurs admin avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { User } from "@/types/auth";
import { UserAccount } from "../../types/admin";
const AdminUserService = {
  /** Tous les utilisateurs. OFFLINE : cache. */
  async getAllUsers(): Promise<UserAccount[]> {
    return withOfflineCache(
      "admin_users_all",
      () => axiosInstance.get("/users").then((r) => r.data),
      []
    );
  },

  /** Créer un utilisateur. OFFLINE : enqueued. */
  async createUser(userData: Partial<UserAccount>): Promise<UserAccount> {
    // Construire un payload propre — n'envoyer que les champs attendus par UserDto
    const payload: Record<string, unknown> = {
      name:         userData.name,
      phone:        userData.phone,
      role:         userData.role ?? "CASHIER",
      passwordHash: userData.pin,   // PIN = mot de passe initial
      isActive:     userData.isActive ?? true,
    };

    // shopId : n'envoyer que si c'est un vrai UUID (pas vide)
    if (userData.shopId) payload.shopId = userData.shopId;
    if (userData.email) payload.email = userData.email;

    // username : laisser le backend le générer automatiquement (user_<timestamp>)
    // pin : champ frontend uniquement, ne pas l'envoyer au backend

    return withOfflineFallback({
      entityType: "Product",
      operation: "CREATE",
      payload: { _type: "User", ...payload },
      apiCall: () =>
        axiosInstance
          .post("/auth/register", payload)
          .then((r) => r.data.user ?? r.data),
      optimisticResult: {
        ...userData,
        id: `local_${Date.now()}`,
        isActive: true,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as UserAccount,
    });
  },

  /** Accès boutiques d'un utilisateur. OFFLINE : cache. */
  async getShopAccesses(userId: string): Promise<User[]> {
    return withOfflineCache(
      `user_shop_accesses_${userId}`,
      async () => {
        const response = await axiosInstance.get(`/users/${userId}`);
        return response.data.data || response.data;
      },
      []
    );
  },

  /** Mettre à jour un utilisateur. OFFLINE : enqueued. */
  async updateUser(id: string, userData: Partial<UserAccount>): Promise<UserAccount> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "User", id, ...userData } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.patch(`/auth/update/${id}`, userData).then((r) => r.data),
      optimisticResult: {
        id,
        ...userData,
        syncStatus: "PENDING",
      } as unknown as UserAccount,
    });
  },

  /** Assigner une boutique à un utilisateur. OFFLINE : enqueued. */
  async assignShopToUser(
    userId: string,
    shopId: string,
    roleInShop: string
  ): Promise<void> {
    await withOfflineFallback<void>({
      entityType: "Product",
      operation: "CREATE",
      payload: { _type: "UserShopAccess", userId, shopId, roleInShop },
      apiCall: async () => {
        try {
          await axiosInstance.post(`/shops/${shopId}/users/${userId}`, { roleInShop });
        } catch (error: any) {
          if (error.response?.status === 409) {
            await axiosInstance.patch(`/shops/${shopId}/users/${userId}`, { roleInShop });
          } else {
            throw error;
          }
        }
      },
      optimisticResult: undefined,
    });
  },

  /** Supprimer un utilisateur. OFFLINE : enqueued. */
  async deleteUser(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "User", id },
      apiCall: () => axiosInstance.delete(`/users/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  },

  /** Activer/désactiver un utilisateur. OFFLINE : enqueued. */
  async toggleUserStatus(id: string, isActive: boolean): Promise<UserAccount> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "User", id, isActive } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .patch(`/auth/update/${id}`, { isActive })
          .then((r) => r.data),
      optimisticResult: { id, isActive, syncStatus: "PENDING" } as unknown as UserAccount,
    });
  },
};

export default AdminUserService;
