import axiosInstance from "../../core/axios";
import { withOfflineCache } from "../../core/offline-wrapper";
import {
  OverviewResponse,
  ShopsPerformanceResponse,
  CategoriesPerformanceResponse,
  CashiersPerformanceResponse,
  SalesTimelineResponse,
  AlertsResponse,
  FinancialReportResponse,
  PeriodQuery,
} from "../../types/dashboard";

// Convertit un objet PeriodQuery en query string propre
function toParams(query: PeriodQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.preset) params.preset = query.preset;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.shopId) params.shopId = query.shopId;
  return params;
}

const DashboardService = {
  async getOverview(query: PeriodQuery): Promise<OverviewResponse> {
    return withOfflineCache(
      `dashboard_overview_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/overview", { params: toParams(query) })
          .then((r) => r.data),
      {} as OverviewResponse
    );
  },

  async getShopsPerformance(query: PeriodQuery & { limit?: number }): Promise<ShopsPerformanceResponse> {
    return withOfflineCache(
      `dashboard_shops_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/shops", {
            params: { ...toParams(query), ...(query.limit ? { limit: query.limit } : {}) },
          })
          .then((r) => r.data),
      { shops: [], period: "" }
    );
  },

  async getCategoriesPerformance(query: PeriodQuery): Promise<CategoriesPerformanceResponse> {
    return withOfflineCache(
      `dashboard_categories_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/categories", { params: toParams(query) })
          .then((r) => r.data),
      { period: "", dateRange: { from: "", to: "" }, shopId: "", totalRevenue: 0, categories: [] }
    );
  },

  async getCashiersPerformance(query: PeriodQuery & { limit?: number }): Promise<CashiersPerformanceResponse> {
    return withOfflineCache(
      `dashboard_cashiers_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/cashiers", {
            params: { ...toParams(query), ...(query.limit ? { limit: query.limit } : {}) },
          })
          .then((r) => r.data),
      {
        period: "",
        dateRange: { from: "", to: "" },
        shopId: "",
        cashiers: [],
        summary: {
          totalCashiers: 0,
          totalRevenue: 0,
          totalTransactions: 0,
          totalVoids: 0,
        },
      }
    );
  },

  async getSalesTimeline(query: PeriodQuery): Promise<SalesTimelineResponse> {
    return withOfflineCache(
      `dashboard_timeline_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/sales-timeline", { params: toParams(query) })
          .then((r) => r.data),
      {
        period: "",
        dateRange: { from: "", to: "" },
        granularity: "",
        timeline: [],
        byShop: [],
        stats: {
          totalRevenue: 0,
          averagePerPeriod: 0,
          bestPeriod: null,
          worstPeriod: null,
          totalDataPoints: 0,
        },
      }
    );
  },

  async getAlerts(params?: {
    lowStockLimit?: number;
    cashDiffThreshold?: number;
    lookbackDays?: number;
  }): Promise<AlertsResponse> {
    return withOfflineCache(
      `dashboard_alerts_${JSON.stringify(params ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/alerts", { params })
          .then((r) => r.data),
      {
        generatedAt: new Date().toISOString(),
        totalAlerts: 0,
        criticalCount: 0,
        warningCount: 0,
        alerts: [],
      }
    );
  },

  async getFinancialReport(query: PeriodQuery): Promise<FinancialReportResponse> {
    return withOfflineCache(
      `dashboard_financial_${JSON.stringify(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/financial-report", { params: toParams(query) })
          .then((r) => r.data),
      {
        period: "",
        dateRange: { from: "", to: "" },
        currency: "XOF",
        pnl: {
          revenue: { gross: 0, discounts: 0, net: 0, evolution: 0, transactions: 0 },
          cogs: { value: 0, rate: 0 },
          grossMargin: { value: 0, rate: 0 },
          expenses: { total: 0, byCategory: [] },
          operatingResult: { value: 0, isProfit: true },
          taxes: 0,
          netResult: { value: 0, isProfit: true, margin: 0 },
        },
        previousPeriod: { revenue: 0 },
      }
    );
  },
};

export default DashboardService;
