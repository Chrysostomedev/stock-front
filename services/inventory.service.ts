/**
 * inventory.service.ts — Service de gestion d'inventaire physique,
 * régularisation atomique des écarts, alertes DLC et mise au rebut (Phases 6 & 7)
 */
import axiosInstance from "../core/axios";

/* ── Types pour la régularisation des écarts (Phase 6) ───────────── */
export interface AdjustDiscrepancyItem {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

export interface AdjustDiscrepanciesDto {
  shopId: string;
  notes?: string;
  items: AdjustDiscrepancyItem[];
}

export interface DiscrepancyDetail {
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  stockBefore: number;
  stockAfter: number;
  discrepancy: number;
  discrepancyValue: number;
  status: "DEFICIT" | "SURPLUS" | "MATCH";
  movementId?: string;
}

export interface AdjustDiscrepanciesResponse {
  shopId: string;
  shopName: string;
  currency: string;
  adjustedCount: number;
  unchangedCount: number;
  totalDiscrepancyQuantity: number;
  totalDiscrepancyValue: number;
  details: DiscrepancyDetail[];
  executedAt: string;
}

export interface AdjustmentHistoryItem {
  id: string;
  shopId: string;
  productId: string;
  product?: {
    name: string;
    sku?: string;
    barcode?: string;
  };
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
  createdAt: string;
}

/* ── Types pour les alertes de péremption & déclassement (Phase 7) ─ */
export interface ExpiredProductItem {
  productId: string;
  productName: string;
  barcode?: string;
  sku?: string;
  categoryName?: string;
  stockQty: number;
  buyingPrice: number;
  sellingPrice: number;
  totalLossValue: number;
  expiryDate: string;
  daysExpired: number;
}

export interface ExpiringSoonProductItem {
  productId: string;
  productName: string;
  barcode?: string;
  sku?: string;
  categoryName?: string;
  stockQty: number;
  buyingPrice: number;
  sellingPrice: number;
  atRiskValue: number;
  expiryDate: string;
  daysRemaining: number;
}

export interface ExpiryAlertsResponse {
  shopId: string;
  shopName: string;
  currency: string;
  summary: {
    expiredCount: number;
    expiredTotalUnits: number;
    expiredTotalLoss: number;
    expiringSoonCount: number;
    expiringSoonTotalUnits: number;
    expiringSoonTotalValue: number;
  };
  expiredProducts: ExpiredProductItem[];
  expiringSoonProducts: ExpiringSoonProductItem[];
}

export type LossReason = "EXPIRED" | "DAMAGED" | "THEFT" | "BROKEN" | "SPOILED" | "OTHER";

export interface WriteOffItem {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface WriteOffDto {
  shopId: string;
  lossReason: LossReason;
  notes?: string;
  items: WriteOffItem[];
}

const InventoryService = {
  /**
   * Régularise les écarts d'inventaire physique de manière atomique (Phase 6)
   */
  async adjustDiscrepancies(dto: AdjustDiscrepanciesDto): Promise<AdjustDiscrepanciesResponse> {
    const res = await axiosInstance.post("/inventory/adjust-discrepancies", dto);
    return res.data;
  },

  /**
   * Récupère l'historique des ajustements pour une boutique
   */
  async getAdjustmentHistory(shopId: string, limit = 50): Promise<AdjustmentHistoryItem[]> {
    const res = await axiosInstance.get(`/inventory/adjustments/history/${shopId}`, {
      params: { limit },
    });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },

  /**
   * Tableau de bord des alertes de péremption (Phase 7)
   */
  async getExpiryAlerts(shopId: string, thresholdDays = 30): Promise<ExpiryAlertsResponse> {
    const res = await axiosInstance.get(`/inventory/expiry-alerts/${shopId}`, {
      params: { thresholdDays },
    });
    return res.data;
  },

  /**
   * Déclaration de mise au rebut / Déclassement de stock (Phase 7)
   */
  async writeOff(dto: WriteOffDto): Promise<any> {
    const res = await axiosInstance.post("/inventory/write-off", dto);
    return res.data;
  },
};

export default InventoryService;
