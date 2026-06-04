/**
 * cashierDashboard.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Récupère le dashboard journalier d'un caissier.
 * GET /cashier-dashboard/overview?userId=...&shopId=...&date=YYYY-MM-DD
 * ─────────────────────────────────────────────────────────────────────────────
 */
import axiosInstance from "../../core/axios";

export interface CashierKpis {
  revenue: number;
  currency: string;
  totalTransactions: number;
  completedTransactions: number;
  voidedTransactions: number;
  voidRate: number;
  averageBasket: number;
  totalDiscounts: number;
  totalChange: number;
  totalPaid: number;
}

export interface CashierPayment {
  method: string;
  amount: number;
  count: number;
  share: number;
}

export interface CashierTimeline {
  hour: string;
  revenue: number;
  transactionCount: number;
}

export interface CashierRecentSale {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
}

export interface CashierOverview {
  period: { date: string; from: string; to: string };
  cashier: { userId: string; name: string; username: string; role: string };
  session: {
    id: string;
    openedAt: string;
    openingBalance: number;
    expectedBalance: number | null;
    closingBalance: number | null;
    difference: number | null;
    isOpen: boolean;
  } | null;
  kpis: CashierKpis;
  payments: CashierPayment[];
  timeline: CashierTimeline[];
  recentSales: CashierRecentSale[];
}

const CashierDashboardService = {
  async getOverview(params: {
    userId: string;
    shopId: string;
    date?: string;
  }): Promise<CashierOverview> {
    const response = await axiosInstance.get("/cashier-dashboard/overview", {
      params,
    });
    return response.data;
  },
};

export default CashierDashboardService;
