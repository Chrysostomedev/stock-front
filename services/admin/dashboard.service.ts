import axiosInstance from "../../core/axios";
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
    const response = await axiosInstance.get("/dashboard-super-admin/overview", {
      params: toParams(query),
    });
    return response.data;
  },

  async getShopsPerformance(query: PeriodQuery & { limit?: number }): Promise<ShopsPerformanceResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/shops", {
      params: { ...toParams(query), ...(query.limit ? { limit: query.limit } : {}) },
    });
    return response.data;
  },

  async getCategoriesPerformance(query: PeriodQuery): Promise<CategoriesPerformanceResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/categories", {
      params: toParams(query),
    });
    return response.data;
  },

  async getCashiersPerformance(query: PeriodQuery & { limit?: number }): Promise<CashiersPerformanceResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/cashiers", {
      params: { ...toParams(query), ...(query.limit ? { limit: query.limit } : {}) },
    });
    return response.data;
  },

  async getSalesTimeline(query: PeriodQuery): Promise<SalesTimelineResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/sales-timeline", {
      params: toParams(query),
    });
    return response.data;
  },

  async getAlerts(params?: {
    lowStockLimit?: number;
    cashDiffThreshold?: number;
    lookbackDays?: number;
  }): Promise<AlertsResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/alerts", {
      params,
    });
    return response.data;
  },

  async getFinancialReport(query: PeriodQuery): Promise<FinancialReportResponse> {
    const response = await axiosInstance.get("/dashboard-super-admin/financial-report", {
      params: toParams(query),
    });
    return response.data;
  },
};

export default DashboardService;
