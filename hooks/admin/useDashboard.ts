"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import DashboardService from "../../services/admin/dashboard.service";
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

interface DashboardState {
  overview: OverviewResponse | null;
  shops: ShopsPerformanceResponse | null;
  categories: CategoriesPerformanceResponse | null;
  cashiers: CashiersPerformanceResponse | null;
  timeline: SalesTimelineResponse | null;
  alerts: AlertsResponse | null;
  financial: FinancialReportResponse | null;
  loading: boolean;
  loadingAlerts: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export function useDashboard(query: PeriodQuery) {
  const [state, setState] = useState<DashboardState>({
    overview: null,
    shops: null,
    categories: null,
    cashiers: null,
    timeline: null,
    alerts: null,
    financial: null,
    loading: false,
    loadingAlerts: false,
    error: null,
    lastRefresh: null,
  });

  const fetchMain = useCallback(async (q: PeriodQuery) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [overview, shops, categories, cashiers, timeline, financial] =
        await Promise.all([
          DashboardService.getOverview(q),
          DashboardService.getShopsPerformance(q),
          DashboardService.getCategoriesPerformance(q),
          DashboardService.getCashiersPerformance(q),
          DashboardService.getSalesTimeline(q),
          DashboardService.getFinancialReport(q),
        ]);

      setState((prev) => ({
        ...prev,
        overview,
        shops,
        categories,
        cashiers,
        timeline,
        financial,
        loading: false,
        lastRefresh: new Date(),
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || err.message || "Erreur de chargement",
      }));
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingAlerts: true }));
    try {
      const alerts = await DashboardService.getAlerts();
      setState((prev) => ({ ...prev, alerts, loadingAlerts: false }));
    } catch {
      setState((prev) => ({ ...prev, loadingAlerts: false }));
    }
  }, []);

  // Stable string key — effect only re-runs when filter content actually changes
  const queryKey = useMemo(() => JSON.stringify(query), [query]);
  const queryRef = useRef<PeriodQuery>(query);
  queryRef.current = query;

  useEffect(() => {
    fetchMain(queryRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Alerts are period-independent — fetch once on mount only
  useEffect(() => {
    fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    fetchMain(query);
    fetchAlerts();
  }, [fetchMain, fetchAlerts, query]);

  return { ...state, refresh };
}
