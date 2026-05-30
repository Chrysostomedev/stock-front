/**
 * quinc/customer.service.ts — Clients quincaillerie avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Customer } from "../../types/quinc";

class QuincCustomerService {
  /** Tous les clients. OFFLINE : cache. */
  async getAll(shopId: string): Promise<Customer[]> {
    return withOfflineCache(
      `quinc_customers_${shopId}`,
      async () => {
        const response = await axiosInstance.get("/customers", {
          params: { shopId },
        });
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Créer un client. OFFLINE : enqueued. */
  async create(data: Partial<Customer>): Promise<Customer> {
    return withOfflineFallback({
      entityType: "Customer",
      operation: "CREATE",
      payload: data as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/customers", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        totalDebt: 0,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as Customer,
    });
  }

  /** Mettre à jour un client. OFFLINE : enqueued. */
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return withOfflineFallback({
      entityType: "Customer",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.patch(`/customers/${id}`, data).then((r) => r.data),
      optimisticResult: { id, ...data, syncStatus: "PENDING" } as unknown as Customer,
    });
  }

  /** Supprimer un client. OFFLINE : enqueued. */
  async delete(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Customer",
      operation: "DELETE",
      payload: { id },
      apiCall: () =>
        axiosInstance.delete(`/customers/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  }
}

export default new QuincCustomerService();
