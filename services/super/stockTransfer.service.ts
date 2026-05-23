/**
 * super/stockTransfer.service.ts — Transferts de stock avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - create()       → enqueued (StockTransfer/CREATE)
 *  - getAll()       → cache localStorage
 *  - getById()      → cache localStorage
 *  - updateStatus() → enqueued (StockTransfer/UPDATE)
 *    ⚠️ Le stock source/destination est ajusté côté backend à la sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { StockTransfer, CreateStockTransferDto } from "../../types/super";

const StockTransferService = {
  /**
   * Créer un transfert de stock. OFFLINE : enqueued.
   * ⚠️ Le stock source sera déduit et le stock destination ajouté à la sync.
   */
  async create(dto: CreateStockTransferDto): Promise<StockTransfer> {
    return withOfflineFallback({
      entityType: "StockTransfer",
      operation: "CREATE",
      payload: dto as unknown as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/stock-transfers", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        transferNumber: `TRF-OFFLINE-${Date.now()}`,
        status: "PENDING",
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as StockTransfer,
    });
  },

  /**
   * Lister les transferts. OFFLINE : cache.
   */
  async getAll(params?: {
    fromShopId?: string;
    toShopId?: string;
    status?: string;
  }): Promise<any> {
    return withOfflineCache(
      `stock_transfers_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance
          .get("/stock-transfers", { params })
          .then((r) => r.data),
      { data: [], total: 0 }
    );
  },

  /**
   * Détail d'un transfert. OFFLINE : cache.
   */
  async getById(id: string): Promise<StockTransfer> {
    return withOfflineCache(
      `stock_transfer_${id}`,
      () =>
        axiosInstance.get(`/stock-transfers/${id}`).then((r) => r.data)
    );
  },

  /**
   * Mettre à jour le statut d'un transfert. OFFLINE : enqueued.
   */
  async updateStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<StockTransfer> {
    return withOfflineFallback({
      entityType: "StockTransfer",
      operation: "UPDATE",
      payload: { id, status, ...(notes ? { notes } : {}) } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .put(`/stock-transfers/${id}/status`, { status, notes })
          .then((r) => r.data),
      optimisticResult: {
        id,
        status,
        notes,
        syncStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      } as unknown as StockTransfer,
    });
  },
};

export default StockTransferService;
