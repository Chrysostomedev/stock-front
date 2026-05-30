/**
 * admin/shop.service.ts — Boutiques admin avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Shop } from "../../types/admin";

const AdminShopService = {
  /** Toutes les boutiques. OFFLINE : cache. */
  async getAllShops(): Promise<Shop[]> {
    return withOfflineCache(
      "admin_shops_all",
      () => axiosInstance.get("/shops").then((r) => r.data),
      []
    );
  },

  /** Créer une boutique. OFFLINE : enqueued. */
  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    return withOfflineFallback({
      entityType: "Product", // proxy — pas de type Shop dans SyncQueue
      operation: "CREATE",
      payload: { _type: "Shop", ...shopData } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/shops", shopData).then((r) => r.data),
      optimisticResult: {
        ...shopData,
        id: `local_${Date.now()}`,
        currency: "XOF",
        isActive: true,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Shop,
    });
  },

  /** Mettre à jour une boutique. OFFLINE : enqueued. */
  async updateShop(id: string, shopData: Partial<Shop>): Promise<Shop> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Shop", id, ...shopData } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/shops/${id}`, shopData).then((r) => r.data),
      optimisticResult: {
        id,
        ...shopData,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as Shop,
    });
  },

  /** Supprimer une boutique. OFFLINE : enqueued. */
  async deleteShop(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "Shop", id },
      apiCall: () => axiosInstance.delete(`/shops/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  },

  /** Activer/désactiver une boutique. OFFLINE : enqueued. */
  async toggleShopStatus(id: string, isActive: boolean): Promise<Shop> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Shop", id, isActive } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .patch(`/shops/${id}/toggle-active`, { isActive })
          .then((r) => r.data),
      optimisticResult: { id, isActive, syncStatus: "PENDING" } as unknown as Shop,
    });
  },
};

export default AdminShopService;
