import axiosInstance from "../core/axios";
import { DailyReport, WeeklyReport, MonthlyReport, DashboardSummary } from "../types/reports";

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
};

export default ReportsService;
