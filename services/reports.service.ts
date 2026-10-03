import axiosInstance from "../core/axios";
import { DailyReport, WeeklyReport, MonthlyReport, DashboardSummary } from "../types/reports";

/* ── Types Analyse Ventes par Produit (Phase 5) ───────────────────── */
export interface ProductSalesSummaryParams {
  shopId: string;
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  search?: string;
  sortBy?: "revenue" | "quantity" | "profit" | "name";
  sortOrder?: "desc" | "asc";
  page?: number;
  limit?: number;
}

export interface ProductSalesSummaryItem {
  productId: string;
  productName: string;
  barcode?: string;
  sku?: string;
  categoryName?: string;
  currentStock: number;
  buyingPrice: number;
  sellingPrice: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginRate: number;
  transactionCount: number;
}

export interface ProductSalesSummaryResponse {
  shop: { id: string; name: string; currency: string };
  period: { from: string; to: string };
  summary: {
    totalProductsSold: number;
    totalUnitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalGrossProfit: number;
    averageMarginRate: number;
  };
  items: ProductSalesSummaryItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/* ── Types Rapport des Pertes (Phase 7) ───────────────────────────── */
export interface LossesReportParams {
  shopId: string;
  fromDate?: string;
  toDate?: string;
  reason?: string;
}

export interface LossItemDetail {
  id: string;
  productId: string;
  productName?: string;
  product?: { name: string; sku?: string; barcode?: string };
  quantity: number;
  unitCost: number;
  totalLoss: number;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface LossesReportResponse {
  shop?: { id: string; name: string; currency: string };
  currency?: string;
  totalLossValue: number;
  totalLossQuantity: number;
  incidentsCount: number;
  byReason: Record<string, { count: number; totalValue: number; totalUnits: number }>;
  items: LossItemDetail[];
}

const ReportsService = {
  async getSummary(shopId: string): Promise<DashboardSummary> {
    const res = await axiosInstance.get(`/reports/summary/${shopId}`);
    return res.data;
  },

  async getDaily(shopId: string, date?: string): Promise<DailyReport> {
    const res = await axiosInstance.get(`/reports/daily/${shopId}`, {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  async getWeekly(shopId: string): Promise<WeeklyReport> {
    const res = await axiosInstance.get(`/reports/weekly/${shopId}`);
    return res.data;
  },

  async getMonthly(shopId: string, month?: number, year?: number): Promise<MonthlyReport> {
    const params: Record<string, number> = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;
    const res = await axiosInstance.get(`/reports/monthly/${shopId}`, {
      params: Object.keys(params).length ? params : undefined,
    });
    return res.data;
  },

  /** Analyse des ventes par produit avec marges et COGS (Phase 5) */
  async getProductSalesSummary(params: ProductSalesSummaryParams): Promise<ProductSalesSummaryResponse> {
    const res = await axiosInstance.get("/reports/sales/products-summary", { params });
    return res.data;
  },

  /** Rapport des pertes de stock sur période (Phase 7) */
  async getLosses(params: LossesReportParams): Promise<LossesReportResponse> {
    const res = await axiosInstance.get("/reports/losses", { params });
    return res.data;
  },
};

export default ReportsService;
