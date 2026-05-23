/**
 * quinc/supplier.service.ts — Fournisseurs avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
  syncStatus?: string;
}

class QuincSupplierService {
  /** Tous les fournisseurs. OFFLINE : cache. */
  async getAll(): Promise<Supplier[]> {
    return withOfflineCache(
      "suppliers_all",
      async () => {
        const response = await axiosInstance.get("/suppliers");
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Créer un fournisseur. OFFLINE : enqueued. */
  async create(data: Partial<Supplier>): Promise<Supplier> {
    return withOfflineFallback({
      entityType: "Product", // proxy — pas de type Supplier dans SyncQueue
      operation: "CREATE",
      payload: { _type: "Supplier", ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/suppliers", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        isActive: true,
        syncStatus: "PENDING",
      } as Supplier,
    });
  }

  /** Mettre à jour un fournisseur. OFFLINE : enqueued. */
  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return withOfflineFallback({
      entityType: "Product",
      operation: "UPDATE",
      payload: { _type: "Supplier", id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.patch(`/suppliers/${id}`, data).then((r) => r.data),
      optimisticResult: { id, ...data, syncStatus: "PENDING" } as unknown as Supplier,
    });
  }

  /** Supprimer un fournisseur. OFFLINE : enqueued. */
  async delete(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Product",
      operation: "DELETE",
      payload: { _type: "Supplier", id },
      apiCall: () =>
        axiosInstance.delete(`/suppliers/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  }
}

export default new QuincSupplierService();
