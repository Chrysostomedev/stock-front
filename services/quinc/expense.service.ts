/**
 * quinc/expense.service.ts — Dépenses quincaillerie avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Expense } from "../../types/quinc";

class QuincExpenseService {
  /** Toutes les dépenses. OFFLINE : cache. */
  async getAll(shopId: string): Promise<Expense[]> {
    return withOfflineCache(
      `quinc_expenses_${shopId}`,
      async () => {
        const response = await axiosInstance.get("/expenses", {
          params: { shopId },
        });
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Créer une dépense. OFFLINE : enqueued. */
  async create(data: Partial<Expense>): Promise<Expense> {
    return withOfflineFallback({
      entityType: "Expense",
      operation: "CREATE",
      payload: data as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/expenses", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as Expense,
    });
  }

  /** Mettre à jour une dépense. OFFLINE : enqueued. */
  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    return withOfflineFallback({
      entityType: "Expense",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.patch(`/expenses/${id}`, data).then((r) => r.data),
      optimisticResult: { id, ...data, syncStatus: "PENDING" } as unknown as Expense,
    });
  }

  /** Supprimer une dépense. OFFLINE : enqueued. */
  async delete(id: string): Promise<void> {
    await withOfflineFallback({
      entityType: "Expense",
      operation: "DELETE",
      payload: { id },
      apiCall: () =>
        axiosInstance.delete(`/expenses/${id}`).then((r) => r.data),
      optimisticResult: { success: true },
    });
  }
}

export default new QuincExpenseService();
