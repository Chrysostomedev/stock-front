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

export type SaleStatus = "COMPLETED" | "PARTIALLY_PAID" | "VOIDED" | "REFUNDED" | "DRAFT";

/** Article d'une vente tel que retourné par le backend (lecture). */
export interface SaleItemDetail {
  id: string;
  saleId?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  product?: { id: string; name: string; barcode?: string; sku?: string };
}

/** Paiement d'une vente tel que retourné par le backend (lecture). */
export interface SalePaymentDetail {
  id: string;
  saleId?: string;
  method: "CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT" | "MIXED";
  amount: number;
  reference?: string;
}

/** Vente complète telle que retournée par le backend. */
export interface Sale {
  id: string;
  receiptNumber?: string;
  saleNumber?: string;
  shopId: string;
  userId: string;
  customerId?: string;
  cashSessionId?: string;
  status: SaleStatus;
  totalAmount: number;
  total?: number;
  subtotal?: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  taxAmount?: number;
  notes?: string;
  syncStatus?: string;
  originalSaleId?: string;
  items: SaleItemDetail[];
  payments: SalePaymentDetail[];
  customer?: { id: string; name: string; phone?: string };
  user?: { id: string; name: string };
  createdAt: string;
  updatedAt?: string;
}

export interface VoidSaleDto {
  userId: string;
  reason: string;
}

export interface RefundItemDto {
  saleItemId: string;
  quantity: number;
}

export interface RefundSaleDto {
  userId: string;
  items?: RefundItemDto[];
  paymentMethod: "CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT" | "MIXED";
  reference?: string;
  returnToStock: boolean;
  reason: string;
}

const SaleService = {
  /**
   * Enregistrer une nouvelle vente.
   * OFFLINE : enqueued → résultat optimiste retourné immédiatement.
   */
  async create(data: CreateSaleDto) {
    const receiptNumber = `SP-OFFLINE-${Date.now()}`;
    return withOfflineFallback({
      entityType: "Sale",
      operation: "CREATE",
      payload: { ...(data as unknown as Record<string, unknown>), receiptNumber },
      apiCall: () => axiosInstance.post("/sales", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        receiptNumber,
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
 
  async void(saleId: string, dto: VoidSaleDto) {
    return axiosInstance.post(`/sales/${saleId}/void`, dto).then((r) => r.data);
  },

  async refund(saleId: string, dto: RefundSaleDto) {
    return axiosInstance.post(`/sales/${saleId}/refund`, dto).then((r) => r.data);
  },
};

export default SaleService;
