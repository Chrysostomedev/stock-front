/**
 * customer.service.ts — Service clients avec fallback offline
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalDebt: number;
  creditLimit?: number;
  notes?: string;
  syncStatus?: string;
  createdAt: string;
}

const CustomerService = {
  /** Lister tous les clients. OFFLINE : cache. */
  async getAll() {
    return withOfflineCache(
      "customers_all",
      () => axiosInstance.get("/customers").then((r) => r.data),
      []
    );
  },

  /** Pagination. OFFLINE : cache. */
  async getPaginated(params: any) {
    return withOfflineCache(
      `customers_paginated_${JSON.stringify(params)}`,
      () =>
        axiosInstance
          .get("/customers/paginate", { params })
          .then((r) => r.data),
      { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    );
  },

  /** Détail client. OFFLINE : cache. */
  async getById(id: string) {
    return withOfflineCache(
      `customer_${id}`,
      () => axiosInstance.get(`/customers/${id}`).then((r) => r.data)
    );
  },

  /** Créer un client. OFFLINE : enqueued. */
  async create(data: Partial<Customer>) {
    return withOfflineFallback({
      entityType: "Customer",
      operation: "CREATE",
      payload: data as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/customers", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        totalDebt: 0,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as Customer,
    });
  },

  /** Mettre à jour un client. OFFLINE : enqueued. */
  async update(id: string, data: Partial<Customer>) {
    return withOfflineFallback({
      entityType: "Customer",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/customers/${id}`, data).then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        syncStatus: "PENDING",
      } as unknown as Customer,
    });
  },

  /** Supprimer un client. OFFLINE : enqueued. */
  async delete(id: string) {
    return withOfflineFallback({
      entityType: "Customer",
      operation: "DELETE",
      payload: { id },
      apiCall: () => axiosInstance.delete(`/customers/${id}`).then((r) => r.data),
      optimisticResult: { success: true, id },
    });
  },
};

export default CustomerService;
