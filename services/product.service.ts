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

/** Helper pour rechercher dans le cache local des produits si la clé exacte est absente offline */
function searchInProductCache(params?: any): Product[] {
  if (typeof window === "undefined") return [];
  const allProductsMap = new Map<string, Product>();

  try {
    const CACHE_PREFIX = "sp_cache_";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX + "products_")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const entryData = parsed?.data;
          const items: Product[] = Array.isArray(entryData)
            ? entryData
            : Array.isArray(entryData?.data)
            ? entryData.data
            : [];
          items.forEach((p) => {
            if (p && p.id) allProductsMap.set(p.id, p);
          });
        }
      }
    }
  } catch {
    // Ignore errors
  }

  let list = Array.from(allProductsMap.values());

  if (params?.shopId) {
    list = list.filter((p) => p.shopId === params.shopId || (p as any).shop?.id === params.shopId || !p.shopId);
  }

  if (params?.search) {
    const term = String(params.search).toLowerCase().trim();
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.includes(term))
    );
  }

  if (params?.categoryId) {
    list = list.filter((p) => p.categoryId === params.categoryId);
  }

  return list;
}

const ProductService = {
  /**
   * Récupérer tous les produits avec pagination automatique.
   * OFFLINE : retourne le cache ou effectue une recherche locale intelligente.
   */
  async getAll(params?: any) {
    const cacheKey = `products_${JSON.stringify(params ?? {})}`;
    try {
      const result = await withOfflineCache(
        cacheKey,
        async () => {
          const response = await axiosInstance.get("/products", { params });
          const resData = response.data;

          // Si pagination active et limit élevé (ex: >= 100), récupérer toutes les pages
          if (params?.limit && params.limit >= 100 && resData?.totalPages > 1 && Array.isArray(resData?.data)) {
            const totalPages = resData.totalPages;
            const allData = [...resData.data];
            const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) =>
              axiosInstance.get("/products", {
                params: { ...params, page: i + 2 },
              })
            );
            const pages = await Promise.all(pagePromises);
            pages.forEach((p) => {
              if (p.data?.data && Array.isArray(p.data.data)) {
                allData.push(...p.data.data);
              }
            });
            return { ...resData, data: allData, totalPages: 1, total: allData.length };
          }

          return resData;
        },
        null as any
      );

      if (result) return result;
    } catch {
      // Fallback au filtrage dans le cache local ci-dessous
    }

    const fallbackList = searchInProductCache(params);
    return { data: fallbackList, total: fallbackList.length, page: 1, limit: fallbackList.length, totalPages: 1 };
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
