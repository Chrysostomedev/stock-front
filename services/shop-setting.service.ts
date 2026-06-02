import axiosInstance from "../core/axios";
import { withOfflineCache, withOfflineFallback } from "../core/offline-wrapper";

export interface ShopSetting {
  id: string;
  shopId: string | null;
  key: string;
  value: string;
  group: string;
}

export interface CreateShopSettingDto {
  shopId: string | null;
  key: string;
  value: string;
  group?: string;
}

const ShopSettingService = {
  /**
   * Récupère tous les paramètres d'une boutique
   */
  async getByShop(shopId: string): Promise<ShopSetting[]> {
    return withOfflineCache(
      `shop_settings_${shopId}`,
      () => axiosInstance.get(`/shop-settings/shop/${shopId}`).then((r) => r.data),
      []
    );
  },

  /**
   * Crée ou met à jour un paramètre. OFFLINE : enqueued si la connexion est coupée.
   */
  async upsert(data: CreateShopSettingDto): Promise<ShopSetting> {
    return withOfflineFallback({
      entityType: "Product", // proxy — pas de type ShopSetting dans SyncQueue
      operation: "CREATE",
      payload: { _type: "ShopSetting", ...data } as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/shop-settings", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
      } as ShopSetting,
    });
  }
};

export default ShopSettingService;
