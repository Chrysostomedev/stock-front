/**
 * super/creditPayment.service.ts — Versements clients avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create()       → enqueued (CreditPayment/CREATE)
 *  - paginate()     → cache localStorage
 *  - getByCustomer()→ cache localStorage
 *  - getById()      → cache localStorage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { CreditPayment, CreateCreditPaymentDto } from "../../types/super";

const CreditPaymentService = {
  /**
   * Enregistrer un versement (remboursement de dette client).
   * OFFLINE : enqueued → résultat optimiste.
   * ⚠️ Le backend réduit automatiquement totalDebt du client à la sync.
   */
  async create(dto: CreateCreditPaymentDto): Promise<CreditPayment> {
    return withOfflineFallback({
      entityType: "CreditPayment",
      operation: "CREATE",
      payload: dto as unknown as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/credit-payments", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as CreditPayment,
    });
  },

  /**
   * Paginer les versements. OFFLINE : cache.
   */
  async paginate(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
  }): Promise<any> {
    return withOfflineCache(
      `credit_payments_paginate_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance
          .get("/credit-payments/paginate", { params })
          .then((r) => r.data),
      { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    );
  },

  /**
   * Historique des versements d'un client. OFFLINE : cache.
   */
  async getByCustomer(customerId: string): Promise<CreditPayment[]> {
    return withOfflineCache(
      `credit_payments_customer_${customerId}`,
      () =>
        axiosInstance
          .get(`/credit-payments/customer/${customerId}`)
          .then((r) => r.data),
      []
    );
  },

  /**
   * Détail d'un versement. OFFLINE : cache.
   */
  async getById(id: string): Promise<CreditPayment> {
    return withOfflineCache(
      `credit_payment_${id}`,
      () =>
        axiosInstance.get(`/credit-payments/${id}`).then((r) => r.data)
    );
  },
};

export default CreditPaymentService;
