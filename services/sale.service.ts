/**
 * sale.service.ts — Service des ventes avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * Toutes les mutations (create) sont enqueued en offline.
 * Les lectures (getAll, getById) utilisent le cache localStorage.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface SalePayment {
  method: "CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT" | "MIXED";
  amount: number;
  reference?: string;
}

export interface CreateSaleDto {
  shopId: string;
  userId: string;
  customerId?: string;
  cashSessionId?: string;
  items: SaleItem[];
  payments: SalePayment[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

const SaleService = {
  /**
   * Enregistrer une nouvelle vente.
   * OFFLINE : enqueued → résultat optimiste retourné immédiatement.
   */
  async create(data: CreateSaleDto) {
    return withOfflineFallback({
      entityType: "Sale",
      operation: "CREATE",
      payload: data as unknown as Record<string, unknown>,
      apiCall: () => axiosInstance.post("/sales", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        receiptNumber: `SP-OFFLINE-${Date.now()}`,
        status: "COMPLETED",
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      },
    });
  },
  /**
   * Récupérer les détails d'une vente.
   * OFFLINE : retourne le cache si disponible.
   */
  async getById(id: string) {
    return withOfflineCache(
      `sale_${id}`,
      () => axiosInstance.get(`/sales/${id}`).then((r) => r.data)
    );
  },

  /**
   * Lister toutes les ventes avec filtres.
   * OFFLINE : retourne le cache de la dernière requête identique.
   */
  async getAll(params?: { shopId?: string; userId?: string; fromDate?: string; toDate?: string; limit?: number; page?: number }) {
    const cacheKey = `sales_${JSON.stringify(params ?? {})}`;
    return withOfflineCache(
      cacheKey,
      () => axiosInstance.get("/sales", { params }).then((r) => r.data),
      { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    );
  },
};

export default SaleService;
