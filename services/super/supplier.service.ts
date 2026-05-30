/**
 * super/supplier.service.ts — Fournisseurs avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create()  → enqueued (proxy Product/CREATE avec _type: "Supplier")
 *  - getAll()  → cache localStorage
 *  - getById() → cache localStorage
 *  - update()  → enqueued (proxy Product/UPDATE)
 *  - delete()  → enqueued (proxy Product/DELETE)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Supplier, CreateSupplierDto } from "../../types/super";

const SupplierService = {
  /**
   * Créer un fournisseur. OFFLINE : enqueued.
   */
  async create(dto: CreateSupplierDto): Promise<Supplier> {
    return withOfflineFallback({
      entityType: "Product", // proxy — Supplier n'est pas dans SyncQueue backend
      operation: "CREATE",
      payload: { _type: "Supplier", ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/suppliers", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        isActive: true,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Supplier,
    });
  },

  /**
   * Lister les fournisseurs. OFFLINE : cache.
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<any> {
    return withOfflineCache(
      `suppliers_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance.get("/suppliers", { params }).then((r) => r.data),
      { data: [], total: 0 }
    );
  },

  /**
   * Détail d'un fournisseur. OFFLINE : cache.
   */
  async getById(id: string): Promise<Supplier> {
    return withOfflineCache(
      `supplier_${id}`,
      () => axiosInstance.get(`/suppliers/${id}`).then((r) => r.data)
    );
  },

  /**
   * Mettre à jour un fournisseur. OFFLINE : enqueued.
   */
  async update(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Supplier", id, ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/suppliers/${id}`, dto).then((r) => r.data),
      optimisticResult: {
        id,
        ...dto,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as Supplier,
    });
  },

  /**
   * Supprimer un fournisseur. OFFLINE : enqueued.
   * ⚠️ Peut échouer à la sync si lié à des bons de commande.
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "Supplier", id },
      apiCall: () =>
        axiosInstance.delete(`/suppliers/${id}`).then((r) => r.data),
      optimisticResult: { success: true, message: "Supprimé localement" },
    });
  },
};

export default SupplierService;
