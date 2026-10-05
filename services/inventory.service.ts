/**
 * inventory.service.ts — Service de gestion d'inventaire physique,
 * régularisation atomique des écarts, alertes DLC et mise au rebut (Phases 6 & 7)
 */
import axiosInstance from "../core/axios";
import ProductService from "./product.service";

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
    try {
      const res = await axiosInstance.get(`/inventory/expiry-alerts/${shopId}`, {
        params: { thresholdDays },
      });
      if (res.data && (res.data.expiredProducts || res.data.summary)) {
        return res.data;
      }
    } catch {
      // Fallback local automatique à partir des produits de la boutique
    }

    try {
      const pRes = await ProductService.getAll({ shopId, limit: 500 });
      const products = Array.isArray(pRes) ? pRes : pRes.data || [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const expiredProducts: ExpiredProductItem[] = [];
      const expiringSoonProducts: ExpiringSoonProductItem[] = [];

      products.forEach((p: any) => {
        if (!p.expiryDate || Number(p.stockQty || 0) <= 0) return;
        const exp = new Date(p.expiryDate);
        if (isNaN(exp.getTime())) return;
        exp.setHours(0, 0, 0, 0);

        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const buyingPrice = Number(p.buyingPrice || 0);
        const sellingPrice = Number(p.sellingPrice || 0);
        const stockQty = Number(p.stockQty || 0);

        if (diffDays < 0) {
          expiredProducts.push({
            productId: p.id,
            productName: p.name,
            barcode: p.barcode,
            sku: p.sku,
            categoryName: p.category?.name,
            stockQty,
            buyingPrice,
            sellingPrice,
            totalLossValue: stockQty * buyingPrice,
            expiryDate: p.expiryDate,
            daysExpired: Math.abs(diffDays),
          });
        } else if (diffDays <= thresholdDays) {
          expiringSoonProducts.push({
            productId: p.id,
            productName: p.name,
            barcode: p.barcode,
            sku: p.sku,
            categoryName: p.category?.name,
            stockQty,
            buyingPrice,
            sellingPrice,
            atRiskValue: stockQty * buyingPrice,
            expiryDate: p.expiryDate,
            daysRemaining: diffDays,
          });
        }
      });

      return {
        shopId,
        shopName: "Boutique",
        currency: "XOF",
        summary: {
          expiredCount: expiredProducts.length,
          expiredTotalUnits: expiredProducts.reduce((sum, p) => sum + p.stockQty, 0),
          expiredTotalLoss: expiredProducts.reduce((sum, p) => sum + p.totalLossValue, 0),
          expiringSoonCount: expiringSoonProducts.length,
          expiringSoonTotalUnits: expiringSoonProducts.reduce((sum, p) => sum + p.stockQty, 0),
          expiringSoonTotalValue: expiringSoonProducts.reduce((sum, p) => sum + p.atRiskValue, 0),
        },
        expiredProducts,
        expiringSoonProducts,
      };
    } catch {
      return {
        shopId,
        shopName: "Boutique",
        currency: "XOF",
        summary: {
          expiredCount: 0,
          expiredTotalUnits: 0,
          expiredTotalLoss: 0,
          expiringSoonCount: 0,
          expiringSoonTotalUnits: 0,
          expiringSoonTotalValue: 0,
        },
        expiredProducts: [],
        expiringSoonProducts: [],
      };
    }
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
