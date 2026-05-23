/**
 * super/purchaseOrder.service.ts — Bons de commande avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create()        → enqueued (PurchaseOrder/CREATE)
 *  - getAll()        → cache localStorage
 *  - getById()       → cache localStorage
 *  - updateStatus()  → enqueued (PurchaseOrder/UPDATE)
 *  - receiveItems()  → enqueued (PurchaseOrder/UPDATE)
 *    ⚠️ La réception incrémente le stock côté backend à la sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  ReceiveItemsDto,
} from "../../types/super";

const PurchaseOrderService = {
  /**
   * Créer un bon de commande. OFFLINE : enqueued.
   */
  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return withOfflineFallback({
      entityType: "PurchaseOrder",
      operation: "CREATE",
      payload: dto as unknown as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/purchase-orders", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        orderNumber: `CMD-OFFLINE-${Date.now()}`,
        status: "DRAFT",
        amountPaid: 0,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as PurchaseOrder,
    });
  },

  /**
   * Lister les bons de commande. OFFLINE : cache.
   */
  async getAll(params?: {
    shopId?: string;
    supplierId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return withOfflineCache(
      `purchase_orders_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance
          .get("/purchase-orders", { params })
          .then((r) => r.data),
      { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    );
  },

  /**
   * Détail d'un bon de commande. OFFLINE : cache.
   */
  async getById(id: string): Promise<PurchaseOrder> {
    return withOfflineCache(
      `purchase_order_${id}`,
      () =>
        axiosInstance.get(`/purchase-orders/${id}`).then((r) => r.data)
    );
  },

  /**
   * Changer le statut d'un bon de commande. OFFLINE : enqueued.
   */
  async updateStatus(id: string, status: string): Promise<PurchaseOrder> {
    return withOfflineFallback({
      entityType: "PurchaseOrder",
      operation: "UPDATE",
      payload: { id, status } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .put(`/purchase-orders/${id}/status`, { status })
          .then((r) => r.data),
      optimisticResult: {
        id,
        status,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as PurchaseOrder,
    });
  },

  /**
   * Réceptionner des articles. OFFLINE : enqueued.
   * ⚠️ Le stock sera incrémenté côté backend lors de la synchronisation.
   */
  async receiveItems(id: string, dto: ReceiveItemsDto): Promise<PurchaseOrder> {
    return withOfflineFallback({
      entityType: "PurchaseOrder",
      operation: "UPDATE",
      payload: { id, _action: "receive", ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .post(`/purchase-orders/${id}/receive`, dto)
          .then((r) => r.data),
      optimisticResult: {
        id,
        status: "PARTIALLY_RECEIVED",
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as PurchaseOrder,
    });
  },
};

export default PurchaseOrderService;
