/**
 * category.service.ts — Service catégories avec fallback offline
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";
export interface Category {
  id: string;
  name: string;
  description?: string;
  colorHex?: string;
  iconName?: string;
  parentId?: string | null;
  shopId?: string | null;
  parent?: Category;
  children?: Category[];
  syncStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  colorHex?: string;
  iconName?: string;
  parentId?: string | null;
  shopId?: string | null;
}
const CategoryService = {
  /** Toutes les catégories. OFFLINE : cache. */
  async getAll(params?: any) {
    return withOfflineCache(
      `categories_${JSON.stringify(params ?? {})}`,
      () => axiosInstance.get("/categories", { params }).then((r) => r.data),
      []
    );
  },
  /**
   * Récupérer les catégories d'une boutique
   * @param shopId UUID de la boutique
   * @param params Filtres et pagination
   */
  async getByShop(shopId: string, params?: any) {
    return withOfflineCache(
      `categories_shop_${shopId}_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance
          .get(`/categories/shop/${shopId}`, { params })
          .then((r) => r.data),
      []
    );
  },

  /** Détail catégorie. OFFLINE : cache. */
  async getById(id: string): Promise<Category> {
    return withOfflineCache(
      `category_${id}`,
      () => axiosInstance.get(`/categories/${id}`).then((r) => r.data)
    );
  },

  /** Créer une catégorie. OFFLINE : enqueued. */
  async create(data: CreateCategoryDto): Promise<Category> {
    return withOfflineFallback({
      entityType: "Product", // Pas de type Category dans SyncQueue → on utilise Product comme proxy
      operation: "CREATE",
      payload: { _type: "Category", ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/categories", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Category,
    });
  },

  /** Mettre à jour une catégorie. OFFLINE : enqueued. */
  async update(id: string, data: Partial<CreateCategoryDto>): Promise<Category> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Category", id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/categories/${id}`, data).then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as Category,
    });
  },

  /** Supprimer une catégorie. OFFLINE : enqueued. */
  async delete(id: string) {
    return withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "Category", id },
      apiCall: () =>
        axiosInstance.delete(`/categories/${id}`).then((r) => r.data),
      optimisticResult: { success: true, id },
    });
  },

  /** Sous-catégories. OFFLINE : cache. */
  async getSubcategories(parentId: string): Promise<Category[]> {
    return withOfflineCache(
      `subcategories_${parentId}`,
      () =>
        axiosInstance
          .get(`/categories/${parentId}/subcategories`)
          .then((r) => r.data),
      []
    );
  },
};

export default CategoryService;
