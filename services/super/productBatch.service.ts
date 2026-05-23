/**
 * super/productBatch.service.ts — Lots produits avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create()      → enqueued (StockMovement/CREATE — proxy lot)
 *  - getByProduct()→ cache localStorage
 *  - getExpiring() → cache localStorage
 *  - update()      → enqueued (StockMovement/UPDATE)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { ProductBatch, CreateProductBatchDto } from "../../types/super";

const ProductBatchService = {
  /**
   * Enregistrer un nouveau lot (arrivage).
   * OFFLINE : enqueued → résultat optimiste.
   * ⚠️ Le backend incrémente le stock du produit à la sync.
   */
  async create(dto: CreateProductBatchDto): Promise<ProductBatch> {
    return withOfflineFallback({
      entityType: "StockMovement", // Le backend crée un StockMovement PURCHASE à la réception
      operation: "CREATE",
      payload: { _type: "ProductBatch", ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/product-batches", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        receivedAt: new Date().toISOString(),
        syncStatus: "PENDING",
      } as unknown as ProductBatch,
    });
  },

  /**
   * Lots d'un produit. OFFLINE : cache.
   */
  async getByProduct(productId: string): Promise<ProductBatch[]> {
    return withOfflineCache(
      `product_batches_${productId}`,
      () =>
        axiosInstance
          .get(`/product-batches/product/${productId}`)
          .then((r) => r.data),
      []
    );
  },

  /**
   * Lots expirant bientôt. OFFLINE : cache.
   */
  async getExpiring(shopId: string, days: number = 30): Promise<ProductBatch[]> {
    return withOfflineCache(
      `product_batches_expiring_${shopId}_${days}`,
      () =>
        axiosInstance
          .get(`/product-batches/expiring/${shopId}`, { params: { days } })
          .then((r) => r.data),
      []
    );
  },

  /**
   * Mettre à jour un lot. OFFLINE : enqueued.
   */
  async update(
    id: string,
    dto: Partial<CreateProductBatchDto>
  ): Promise<ProductBatch> {
    return withOfflineFallback({
      entityType: "StockMovement",
      operation: "UPDATE",
      payload: { _type: "ProductBatch", id, ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/product-batches/${id}`, dto).then((r) => r.data),
      optimisticResult: {
        id,
        ...dto,
        syncStatus: "PENDING",
      } as unknown as ProductBatch,
    });
  },
};

export default ProductBatchService;
