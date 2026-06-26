export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "LOW_STOCK";

interface PeriodStats {
  revenue: number;
  sales: number;
  cogs: number;
  grossMargin: number;
  expenses: number;
  netRevenue: number;
}

export interface DailyReport {
  shopName: string;
  date: string;
  totalRevenue: number;
  totalSales: number;
  cogs: number;
  grossMargin: number;
  grossMarginPct: number;
  totalExpenses: number;
  netRevenue: number;
  topProducts: {
    name: string;
    qty: number;
    revenue: number;
    cost: number;
    margin: number;
  }[];
  lowStockProducts: {
    name: string;
    stock: number;
    unit: string;
  }[];
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
}

export interface WeeklyReport {
  shopName: string;
  weekLabel: string;
  currentWeek: PeriodStats;
  previousWeek: PeriodStats;
  revenueGrowth: number;
  marginGrowth: number;
  salesGrowth: number;
  topProducts: {
    name: string;
    qty: number;
    revenue: number;
    margin: number;
  }[];
  dailyBreakdown: {
    day: string;
    revenue: number;
    sales: number;
    margin: number;
  }[];
}

export interface MonthlyReport {
  shopName: string;
  monthLabel: string;
  currentMonth: PeriodStats & { grossMarginPct: number };
  previousMonth: PeriodStats;
  revenueGrowth: number;
  marginGrowth: number;
  topProducts: {
    name: string;
    qty: number;
    revenue: number;
    margin: number;
  }[];
  topCategories: {
    name: string;
    revenue: number;
    margin: number;
  }[];
  weeklyBreakdown: {
    week: string;
    revenue: number;
    sales: number;
    margin: number;
  }[];
  lowStockProducts: {
    name: string;
    stock: number;
    unit: string;
  }[];
}

export interface DashboardSummary {
  today: {
    revenue: number;
    sales: number;
    grossMargin: number;
    grossMarginPct: number;
    netRevenue: number;
    expenses: number;
  };
  topProducts: {
    name: string;
    qty: number;
    revenue: number;
    cost: number;
    margin: number;
  }[];
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
  lowStockAlert: {
    count: number;
    critical: number;
  };
}

export interface ReportSubscription {
  id: string;
  shopId: string;
  userId: string;
  email: string;
  reportType: ReportType;
  isActive: boolean;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  shop?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}
