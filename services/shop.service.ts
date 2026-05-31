/**
 * shop.service.ts — Service boutiques racine avec fallback offline
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";
export type ShopType = typeof ShopType[keyof typeof ShopType];
export const ShopType = {
  SUPERMARKET: "SUPERMARKET", // Superette / épicerie
  HARDWARE: "HARDWARE", // Quincaillerie
  PHARMACY: "PHARMACY", // Pharmacie
  RESTAURANT: "RESTAURANT", // Restaurant / fast-food
  GAS_STATION: "GAS_STATION", // Station-service / dépôt de gaz
  CLOTHING: "CLOTHING", // Prêt-à-porter / textile
  ELECTRONICS: "ELECTRONICS", // High-tech / électronique
  BAKERY: "BAKERY", // Boulangerie / pâtisserie
  WHOLESALE: "WHOLESALE", // Commerce de gros
  OTHER: "OTHER", // Autre
}

export interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoUrl?: string;
  currency: string;
  isActive: boolean;
  typeShop: ShopType;
  shopTypeLabel?:string;
  syncStatus?: string;
  createdAt: string;
  updatedAt: string;
}

const ShopService = {
  /** Toutes les boutiques. OFFLINE : cache. */
  async getAll() {
    return withOfflineCache(
      "shops_all",
      () => axiosInstance.get("/shops").then((r) => r.data),
      []
    );
  },

  /** Détail boutique. OFFLINE : cache. */
  async getById(id: string): Promise<Shop> {
    return withOfflineCache(
      `shop_${id}`,
      () => axiosInstance.get(`/shops/${id}`).then((r) => r.data)
    );
  },

  /** Créer une boutique. OFFLINE : enqueued. */
  async create(data: any): Promise<Shop> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "CREATE",
      payload: { _type: "Shop", ...data },
      apiCall: () => axiosInstance.post("/shops", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        currency: "XOF",
        isActive: true,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Shop,
    });
  },

  /** Mettre à jour une boutique. OFFLINE : enqueued. */
  async update(id: string, data: any): Promise<Shop> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Shop", id, ...data },
      apiCall: () =>
        axiosInstance.put(`/shops/${id}`, data).then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as Shop,
    });
  },

  /** Supprimer une boutique. OFFLINE : enqueued. */
  async delete(id: string) {
    return withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "Shop", id },
      apiCall: () =>
        axiosInstance.delete(`/shops/${id}`).then((r) => r.data),
      optimisticResult: { success: true, id },
    });
  },
};

export default ShopService;
