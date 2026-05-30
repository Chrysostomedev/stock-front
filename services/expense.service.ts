/**
 * expense.service.ts — Service dépenses avec fallback offline
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";
import { Expense, CreateExpenseDto, FilterExpenseDto, ExpenseCategory } from "../types/super";

export type { Expense, CreateExpenseDto, FilterExpenseDto };
export { ExpenseCategory };

const ExpenseService = {
  /** Lister les dépenses. OFFLINE : cache. */
  async getAll(params?: FilterExpenseDto) {
    return withOfflineCache(
      `expenses_${JSON.stringify(params ?? {})}`,
      () => axiosInstance.get("/expenses", { params }).then((r) => r.data),
      []
    );
  },

  /** Détail dépense. OFFLINE : cache. */
  async getById(id: string) {
    return withOfflineCache(
      `expense_${id}`,
      () => axiosInstance.get(`/expenses/${id}`).then((r) => r.data)
    );
  },

  /** Créer une dépense. OFFLINE : enqueued. */
  async create(data: CreateExpenseDto) {
    return withOfflineFallback({
      entityType: "Expense",
      operation: "CREATE",
      payload: data as unknown as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/expenses", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      },
    });
  },

  /** Mettre à jour une dépense. OFFLINE : enqueued. */
  async update(id: string, data: Partial<CreateExpenseDto>) {
    return withOfflineFallback({
      entityType: "Expense",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.put(`/expenses/${id}`, data).then((r) => r.data),
      optimisticResult: { id, ...data, syncStatus: "PENDING" },
    });
  },

  /** Supprimer une dépense. OFFLINE : enqueued. */
  async delete(id: string, userId?: string) {
    return withOfflineFallback({
      entityType: "Expense",
      operation: "DELETE",
      payload: { id, userId: userId ?? "" },
      apiCall: () =>
        axiosInstance
          .delete(`/expenses/${id}`, { params: userId ? { userId } : undefined })
          .then((r) => r.data),
      optimisticResult: { success: true, id },
    });
  },
};

export default ExpenseService;
