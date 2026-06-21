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

// Génère une clé de cache stable indépendamment de l'ordre des propriétés de l'objet.
// JSON.stringify({ a:1, b:2 }) ≠ JSON.stringify({ b:2, a:1 }) → doublons de cache sans ça.
function stableKey(obj: object): string {
  return JSON.stringify(Object.fromEntries(Object.entries(obj as Record<string, unknown>).sort()));
}

// Traduit un PeriodQuery frontend vers les paramètres attendus par le backend
// Backend attend : period ('day'|'week'|'month'|'year'|'custom'), startDate, endDate, shopIds
function toParams(query: PeriodQuery): Record<string, string> {
  const params: Record<string, string> = {};

  const now = new Date();
  const toISO = (d: Date) => d.toISOString();

  const startOf = (d: Date) => {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  };
  const endOf = (d: Date) => {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  };

  switch (query.preset) {
    case "today":
      params.period = "day";
      break;

    case "7d": {
      // "7 derniers jours" = custom avec dates calculées
      const from = startOf(new Date(now));
      from.setDate(from.getDate() - 6);
      params.period    = "custom";
      params.startDate = toISO(from);
      params.endDate   = toISO(endOf(now));
      break;
    }

    case "30d": {
      // "30 derniers jours" = custom avec dates calculées
      const from = startOf(new Date(now));
      from.setDate(from.getDate() - 29);
      params.period    = "custom";
      params.startDate = toISO(from);
      params.endDate   = toISO(endOf(now));
      break;
    }

    case "month":
      params.period = "month";
      break;

    case "custom":
      params.period = "custom";
      if (query.from) params.startDate = query.from;
      if (query.to)   params.endDate   = query.to;
      break;

    default:
      params.period = "month";
  }

  // Backend attend "shopIds" (pluriel) et non "shopId"
  if (query.shopId) params.shopIds = query.shopId;

  return params;
}

const DashboardService = {
  async getOverview(query: PeriodQuery): Promise<OverviewResponse> {
    return withOfflineCache(
      `dashboard_overview_${stableKey(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/overview", { params: toParams(query) })
          .then((r) => r.data),
      {} as OverviewResponse
    );
  },
  async getShopsPerformance(query: PeriodQuery & { limit?: number }): Promise<ShopsPerformanceResponse> {
    return withOfflineCache(
      `dashboard_shops_${stableKey(query ?? {})}`,
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
      `dashboard_categories_${stableKey(query ?? {})}`,
      () =>
        axiosInstance
          .get("/dashboard-super-admin/categories", { params: toParams(query) })
          .then((r) => r.data),
      { period: "", dateRange: { from: "", to: "" }, shopId: "", totalRevenue: 0, categories: [] }
    );
  },

  async getCashiersPerformance(query: PeriodQuery & { limit?: number }): Promise<CashiersPerformanceResponse> {
    return withOfflineCache(
      `dashboard_cashiers_${stableKey(query ?? {})}`,
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
      `dashboard_timeline_${stableKey(query ?? {})}`,
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
      `dashboard_alerts_${stableKey(params ?? {})}`,
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
      `dashboard_financial_${stableKey(query ?? {})}`,
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
