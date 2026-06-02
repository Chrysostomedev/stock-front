import axiosInstance from "../../core/axios";
import { withOfflineCache, withOfflineFallback } from "../../core/offline-wrapper";
import { Category } from "../../types/quinc";

/**
 * quinc/category.service.ts — Service catégories pour la partie quincaillerie.
 *
 * Ce service utilise le cache local pour les lectures et la queue offline
 * pour les écritures lorsque la connexion est interrompue.
 */
class QuincCategoryService {
  /** Liste des catégories de la quincaillerie. OFFLINE : cache localStorage. */
  async getAll(shopId: string): Promise<Category[]> {
    return withOfflineCache(
      `quinc_categories_${shopId}`,
      async () => {
        const response = await axiosInstance.get("/categories", {
          params: { shopId },
        });
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Catégories d'une boutique spécifique. OFFLINE : cache localStorage. */
  async getByShop(shopId: string, params?: Record<string, unknown>): Promise<Category[]> {
    return withOfflineCache(
      `quinc_categories_shop_${shopId}_${JSON.stringify(params ?? {})}`,
      async () => {
        const response = await axiosInstance.get(`/categories/shop/${shopId}`, { params });
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Crée une catégorie. OFFLINE : mise en file d'attente si nécessaire. */
  async create(data: Partial<Category>): Promise<Category> {
    return withOfflineFallback({
      entityType: "Product", // proxy — pas de type Category dans SyncQueue
      operation: "CREATE",
      payload: { _type: "Category", ...data } as Record<string, unknown>,
      apiCall: async () => {
        const response = await axiosInstance.post("/categories", data);
        return response.data;
      },
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Category,
    });
  }
}

export default new QuincCategoryService();
