// ================================================================
// Types TypeScript pour le Dashboard Super-Admin
// Reflète les DTOs RÉELS du backend DashboardSuperAdminController
// ================================================================

export type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

export interface PeriodQuery {
  preset?: PeriodPreset;
  from?: string; // ISO date string
  to?: string;   // ISO date string
  shopId?: string;
}

// ── Overview / KPIs ─────────────────────────────────────────────
// Shape returned by GET /dashboard-super-admin/overview

export interface OverviewKpis {
  revenue: { value: number; previous: number; evolution: number; currency: string };
  transactions: { value: number; previous: number; evolution: number };
  grossMargin: { value: number; rate: number; currency: string };
  expenses: { value: number; previous: number; evolution: number };
  netResult: { value: number; isProfit: boolean };
  creditOutstanding: { amount: number; customersCount: number };
  newCustomers: number;
  activeShops: number;
  averageBasket: number;
  totalDiscounts: number;
}

export interface OverviewResponse {
  period: string;
  dateRange: { from: string; to: string };
  kpis: OverviewKpis;
}

// ── Shops Performance ────────────────────────────────────────────

export interface ShopPerformance {
  shopId: string;
  shopName: string;
  revenue: number;
  transactions: number;
  grossMargin: number;
  marginRate: number;
  rank: number;
}

export interface ShopsPerformanceResponse {
  shops: ShopPerformance[];
  period: string;
}

// ── Categories Performance ───────────────────────────────────────
// Shape returned by GET /dashboard-super-admin/categories (confirmed from Swagger)

export interface CategoryPerformance {
  categoryId: string | null;
  categoryName: string | null;
  colorHex: string | null;          // real field name (NOT categoryColor)
  revenue: number;
  cogs: number;
  grossMargin: number;
  grossMarginRate: number;
  revenueShare: number;             // real field name (NOT percentage)
  quantity: number;
  transactions: number;
  topProducts?: Array<{
    productId: string;
    productName: string;
    revenue: number;
    quantity: number;
  }>;
}

export interface CategoriesPerformanceResponse {
  period: string;
  dateRange: { from: string; to: string };
  shopId: string;
  totalRevenue: number;             // real field name (NOT total)
  categories: CategoryPerformance[];
}

// ── Cashiers Performance ─────────────────────────────────────────
// Confirmed from logs

export interface CashierPerformance {
  userId: string;
  name: string;
  username: string;
  role: string;
  shopId: string;
  shopName: string;
  revenue: number;           // NOT totalAmount
  previousRevenue: number;
  evolution: number;
  transactions: number;      // NOT transactionCount
  averageBasket: number;
  voidedSales: number;       // NOT voidedCount
  voidRate: number;
  totalDiscounts: number;    // NOT discountAmount
  discountRate: number;
  activeMinutes: number | null;
  sessionCount: number;
  cashDifference: number;
  revenuePerHour: number | null;
  rank: number;
}

export interface CashiersPerformanceResponse {
  period: string;
  dateRange: { from: string; to: string };
  shopId: string;
  cashiers: CashierPerformance[];
  summary: {
    totalCashiers: number;
    totalRevenue: number;
    totalTransactions: number;
    totalVoids: number;
  };
}

// ── Sales Timeline ──────────────────────────────────────────────────
// Confirmed from logs: uses byShop[].data[] with timeKey + revenue

export interface TimelineDataPoint {
  timeKey: string;    // e.g. "2026-05-10" (NOT date or createdAt)
  revenue: number;    // NOT totalAmount
  transactions: number;
}

export interface ShopTimeline {
  shopId: string;
  shopName: string;
  data: TimelineDataPoint[];
}

export interface SalesTimelineStats {
  totalRevenue: number;
  averagePerPeriod: number;
  bestPeriod: TimelineDataPoint | null;
  worstPeriod: TimelineDataPoint | null;
  totalDataPoints: number;
}

export interface SalesTimelineResponse {
  period: string;
  dateRange: { from: string; to: string };
  granularity: string;
  timeline: TimelineDataPoint[];   // global aggregated
  byShop: ShopTimeline[];          // per-shop breakdown
  stats: SalesTimelineStats;
}

// ── Alerts ───────────────────────────────────────────────────────
// Confirmed from logs: Swagger returns an array of alert items

export interface AlertDetailItem {
  id: string;
  shopName: string;
  name?: string;               // for low stock
  stockQty?: number;           // for low stock
  minStockQty?: number;        // for low stock
  cashierName?: string;        // for sessions/cash
  openedAt?: string;           // for sessions
  closedAt?: string;           // for cash
  difference?: number;         // for cash
  pending?: number;            // for sync
  errors?: number;             // for sync
}

export interface AlertCategory {
  type: "LOW_STOCK" | "UNCLOSED_SESSIONS" | "ABNORMAL_CASH_SESSIONS" | "SYNC_STATUS" | string;
  severity: "critical" | "warning" | string;
  message: string;
  count: number;
  details: {
    items?: AlertDetailItem[];
    pending?: number;
    errors?: number;
    [key: string]: any;
  };
}

export interface AlertsResponse {
  generatedAt: string;
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  alerts: AlertCategory[];
}

// ── Financial Report ─────────────────────────────────────────────
// Confirmed from logs: all data nested under pnl{}

export interface FinancialReportResponse {
  period: string;
  dateRange: { from: string; to: string };
  currency: string;
  pnl: {
    revenue: {
      gross: number;
      discounts: number;
      net: number;
      evolution: number;
      transactions: number;
    };
    cogs: { value: number; rate: number };
    grossMargin: { value: number; rate: number };
    expenses: {
      total: number;
      byCategory: Array<{ category: string; amount: number }>;
    };
    operatingResult: { value: number; isProfit: boolean };
    taxes: number;
    netResult: { value: number; isProfit: boolean; margin: number };
  };
  previousPeriod: { revenue: number };
}
