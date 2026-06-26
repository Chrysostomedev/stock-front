import axiosInstance from "../core/axios";
import { ReportSubscription, ReportType } from "../types/reports";

const ReportSubscriptionsService = {
  async create(data: {
    shopId: string;
    email: string;
    reportType: ReportType;
  }): Promise<ReportSubscription> {
    const res = await axiosInstance.post("/report-subscriptions", data);
    return res.data;
  },

  async getMy(): Promise<ReportSubscription[]> {
    const res = await axiosInstance.get("/report-subscriptions/my");
    return res.data;
  },

  async getByShop(shopId: string): Promise<ReportSubscription[]> {
    const res = await axiosInstance.get(`/report-subscriptions/shop/${shopId}`);
    return res.data;
  },

  async update(
    id: string,
    data: { email?: string; isActive?: boolean }
  ): Promise<ReportSubscription> {
    const res = await axiosInstance.patch(`/report-subscriptions/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const res = await axiosInstance.delete(`/report-subscriptions/${id}`);
    return res.data;
  },

  async sendNow(id: string): Promise<{ sent: boolean; message: string }> {
    const res = await axiosInstance.post(`/report-subscriptions/${id}/send-now`);
    return res.data;
  },
};

export default ReportSubscriptionsService;
