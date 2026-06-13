/**
 * productComponent.service.ts — Composition de kits avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create() → enqueued (ProductComponent/CREATE)
 *  - getByKit() → cache localStorage
 *  - update() → enqueued (ProductComponent/UPDATE)
 *  - delete() → enqueued (ProductComponent/DELETE)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";
import { ProductComponent, CreateProductComponentDto } from "../types/super";

const ProductComponentService = {
  /**
   * Ajouter un composant à un kit.
   * OFFLINE : enqueued → résultat optimiste.
   */
  async create(dto: CreateProductComponentDto): Promise<ProductComponent> {
    return withOfflineFallback({
      entityType: "ProductComponent",
      operation: "CREATE",
      payload: dto as unknown as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/product-components", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ProductComponent,
    });
  },

  /**
   * Composants d'un kit. OFFLINE : cache.
   */
  async getByKit(kitProductId: string): Promise<ProductComponent[]> {
    return withOfflineCache(
      `product_components_${kitProductId}`,
      () =>
        axiosInstance
          .get(`/product-components/kit/${kitProductId}`)
          .then((r) => r.data),
      []
    );
  },

  /**
   * Modifier la quantité d'un composant. OFFLINE : enqueued.
   */
  async update(
    id: string,
    dto: Partial<CreateProductComponentDto>
  ): Promise<ProductComponent> {
    return withOfflineFallback({
      entityType: "ProductComponent",
      operation: "UPDATE",
      payload: { id, ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/product-components/${id}`, dto).then((r) => r.data),
      optimisticResult: {
        id,
        ...dto,
        updatedAt: new Date().toISOString(),
      } as unknown as ProductComponent,
    });
  },

  /**
   * Retirer un composant du kit. OFFLINE : enqueued.
   */
  async delete(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "ProductComponent",
      operation: "DELETE",
      payload: { id } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.delete(`/product-components/${id}`).then(() => null),
      optimisticResult: null as unknown as ProductComponent,
    });
  },
};

export default ProductComponentService;
