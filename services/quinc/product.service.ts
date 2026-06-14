/**
 * quinc/product.service.ts — Produits quincaillerie avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Product } from "../../types/quinc";

class QuincProductService {
  /** Tous les produits de la boutique. OFFLINE : cache. */
  async getAll(shopId: string): Promise<Product[]> {
    return withOfflineCache(
      `quinc_products_${shopId}`,
      async () => {
        try {
          const response = await axiosInstance.get("/products", {
            params: { shopId, limit: 200 },
          });
          const data = response.data?.data || response.data;
          return Array.isArray(data) ? data : [];
        } catch {
          // Pagination automatique en fallback
          const first = await axiosInstance.get("/products", {
            params: { shopId, page: 1 },
          });
          const resData = first.data;
          const totalPages = resData.totalPages ?? 1;
          const allData = [...(resData.data ?? [])];
          if (totalPages > 1) {
            const pages = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, i) =>
                axiosInstance.get("/products", {
                  params: { shopId, page: i + 2 },
                })
              )
            );
            pages.forEach((p) => allData.push(...(p.data?.data ?? [])));
          }
          return allData;
        }
      },
      []
    );
  }

  /** Créer un produit. OFFLINE : enqueued. */
  async create(data: Partial<Product>): Promise<Product> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "CREATE",
      payload: data as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/products", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as Product,
    });
  }

  /** Mettre à jour un produit. OFFLINE : enqueued. */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.patch(`/products/${id}`, data).then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        syncStatus: "PENDING",
      } as unknown as Product,
    });
  }

  /** Lookup exact par code-barres. Retourne le produit ou null si 404. */
  async getByBarcode(barcode: string, shopId?: string): Promise<Product | null> {
    try {
      const params: any = {};
      if (shopId) params.shopId = shopId;
      const response = await axiosInstance.get(
        `/products/barcode/${encodeURIComponent(barcode)}`,
        { params }
      );
      return response.data as Product;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }

  /** Supprimer un produit. OFFLINE : enqueued. */
  async delete(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { id },
      apiCall: () => axiosInstance.delete(`/products/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  }
}

export default new QuincProductService();
