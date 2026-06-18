import axiosInstance from "../core/axios";

export interface InventoryPeriodParams {
  period?: "day" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

/* ── Overview ──────────────────────────────────────────────── */
export interface InventoryOverviewResponse {
  shopId: string;
  period: string;
  dateRange: { from: string; to: string };
  stock: {
    totalActiveProducts: number;
    totalStockUnits: number;
    inventoryValue: number;
    potentialRevenue: number;
    potentialProfit: number;
    potentialProfitRate: number;
  };
  sales: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitRate: number;
    transactionCount: number;
    unitsSold: number;
  };
  alerts: {
    outOfStock: number;
    lowStock: number;
  };
}

/* ── Top Products ───────────────────────────────────────────── */
export interface TopProductItem {
  rank: number;
  productId: string;
  productName: string;
  sku: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  stockQty: number;
  buyingPrice: number;
  sellingPrice: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitRate: number;
  transactionCount: number;
  stockCoverDays: number | null;
}

export interface DormantProduct {
  productId: string;
  productName: string;
  stockQty: number;
  stockValue: number;
  daysSinceLastSale: number | null;
}

export interface TopProductsResponse {
  shopId: string;
  period: string;
  dateRange: { from: string; to: string };
  periodDays: number;
  topSellers: TopProductItem[];
  dormantProducts: DormantProduct[];
}

/* ── Valuation ──────────────────────────────────────────────── */
export interface CategoryStockItem {
  categoryId: string | null;
  categoryName: string;
  colorHex: string;
  productCount: number;
  totalStockUnits: number;
  inventoryValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  shareOfTotalValue: number;
}

export interface StockValuationResponse {
  shopId: string;
  currency: string;
  totalInventoryValue: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  byCategory: CategoryStockItem[];
}

/* ── Alerts ─────────────────────────────────────────────────── */
export interface AlertProductItem {
  productId: string;
  productName: string;
  sku: string | null;
  categoryName: string | null;
  stockQty: number;
  minStockQty: number;
  buyingPrice: number;
  stockValue: number;
}

export interface DormantAlertItem {
  productId: string;
  productName: string;
  stockQty: number;
  stockValue: number;
  daysSinceLastSale: number | null;
}

export interface InventoryAlertsResponse {
  shopId: string;
  generatedAt: string;
  summary: {
    outOfStockCount: number;
    lowStockCount: number;
    dormantCount: number;
    totalAlerts: number;
  };
  outOfStock: AlertProductItem[];
  lowStock: AlertProductItem[];
  dormantProducts: DormantAlertItem[];
}

/* ── Service ─────────────────────────────────────────────────── */
const InventoryDashboardService = {
  async getOverview(
    shopId: string,
    params?: InventoryPeriodParams
  ): Promise<InventoryOverviewResponse> {
    const res = await axiosInstance.get(
      `/inventory-dashboard/overview/${shopId}`,
      { params }
    );
    return res.data;
  },

  async getTopProducts(
    shopId: string,
    params?: InventoryPeriodParams & { limit?: number }
  ): Promise<TopProductsResponse> {
    const res = await axiosInstance.get(
      `/inventory-dashboard/products/${shopId}`,
      { params }
    );
    return res.data;
  },

  async getValuation(shopId: string): Promise<StockValuationResponse> {
    const res = await axiosInstance.get(
      `/inventory-dashboard/valuation/${shopId}`
    );
    return res.data;
  },

  async getAlerts(
    shopId: string,
    params?: InventoryPeriodParams
  ): Promise<InventoryAlertsResponse> {
    const res = await axiosInstance.get(
      `/inventory-dashboard/alerts/${shopId}`,
      { params }
    );
    return res.data;
  },
};

export default InventoryDashboardService;
