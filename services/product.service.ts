/**
 * product.service.ts — Service produits avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE / UPDATE / DELETE → enqueued en offline
 * GET → cache localStorage (TTL 24h)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";
import { AxiosError } from "axios";

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholeSalePrice?: number;
  stockQty: number;
  minStockQty: number;
  maxStockQty?: number;
  hasBatchTracking: boolean;
  metadata?: any;
  isActive: boolean;
  shopId: string;
  categoryId?: string;
  unitId?: string;
  category?: { name: string };
  shop?: { name: string };
  syncStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  barcode?: string;
  sku?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholeSalePrice?: number;
  stockQty?: number;
  minStockQty?: number;
  maxStockQty?: number;
  hasBatchTracking?: boolean;
  metadata?: any;
  isActive?: boolean;
  shopId: string;
  categoryId?: string;
  unitId?: string;
}

const ProductService = {
  /**
   * Récupérer tous les produits avec pagination automatique.
   * OFFLINE : retourne le cache.
   */
  async getAll(params?: any) {
    const cacheKey = `products_${JSON.stringify(params ?? {})}`;
    return withOfflineCache(
      cacheKey,
      async () => {
        try {
          const response = await axiosInstance.get("/products", { params });
          return response.data;
        } catch {
          // Fallback pagination automatique
          const firstPage = await axiosInstance.get("/products", {
            params: { ...params, page: 1 },
          });
          const resData = firstPage.data;
          const totalPages = resData.totalPages ?? 1;
          const allData = [...(resData.data ?? [])];
          if (totalPages > 1) {
            const pages = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, i) =>
                axiosInstance.get("/products", {
                  params: { ...params, page: i + 2 },
                })
              )
            );
            pages.forEach((p) => allData.push(...(p.data?.data ?? [])));
          }
          return { ...resData, data: allData, totalPages: 1 };
        }
      },
      { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    );
  },

  /** Récupérer un produit par ID. OFFLINE : cache. */
  async getById(id: string): Promise<Product> {
    return withOfflineCache(
      `product_${id}`,
      () => axiosInstance.get(`/products/${id}`).then((r) => r.data)
    );
  },

  /** Créer un produit. OFFLINE : enqueued. */
  async create(data: CreateProductDto): Promise<Product> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "CREATE",
      payload: data as unknown as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/products", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        stockQty: data.stockQty ?? 0,
        minStockQty: data.minStockQty ?? 5,
        hasBatchTracking: data.hasBatchTracking ?? false,
        isActive: data.isActive ?? true,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product,
    });
  },

  /** Mettre à jour un produit. OFFLINE : enqueued. */
  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/products/${id}`, data).then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as Product,
    });
  },

  /** Supprimer un produit. OFFLINE : enqueued. */
  async delete(id: string) {
    return withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { id },
      apiCall: () =>
        axiosInstance.delete(`/products/${id}`).then((r) => r.data),
      optimisticResult: { success: true, id, syncStatus: "PENDING" },
    });
  },

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
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) return null;
      throw err;
    }
  },

  /** Alertes stock. OFFLINE : cache. */
  async getStockAlerts(shopId: string): Promise<Product[]> {
    return withOfflineCache(
      `stock_alerts_${shopId}`,
      () =>
        axiosInstance
          .get(`/products/alerts/${shopId}`)
          .then((r) => r.data),
      []
    );
  },
};

export default ProductService;
