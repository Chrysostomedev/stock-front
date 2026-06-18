"use client";

import { useState, useCallback } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useDashboard } from "@/hooks/admin/useDashboard";
import { useShops } from "@/hooks/admin/useShops";
import { PeriodQuery } from "@/types/dashboard";

// Components
import PeriodSelector from "./components/PeriodSelector";
import KpiCard from "./components/KpiCard";
import SalesTimeline from "./components/SalesTimeline";
import ShopsLeaderboard from "./components/ShopsLeaderboard";
import CategoryDonut from "./components/CategoryDonut";
import CashiersTable from "./components/CashiersTable";
import AlertsPanel from "./components/AlertsPanel";
import FinancialReport from "./components/FinancialReport";
import ExpirationWidget from "./components/ExpirationWidget";

// Lucide icons
import {
  BarChart2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  RefreshCw,
  Building2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
const DEFAULT_QUERY: PeriodQuery = { preset: "30d" };

export default function SuperAdminDashboardPage() {
  const [query, setQuery] = useState<PeriodQuery>(DEFAULT_QUERY);
  const { shops } = useShops();

  const {
    overview,
    shops: shopsPerf,
    categories,
    cashiers,
    timeline,
    alerts,
    financial,
    loading,
    loadingAlerts,
    error,
    lastRefresh,
    refresh,
  } = useDashboard(query);

  const handleQueryChange = useCallback((q: PeriodQuery) => {
    setQuery(q);
  }, []);

  // Format helpers
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

  return (
    <AppLayout
      title="Dashboard Super-Admin"
      subtitle="Vue analytique globale — SP SERVICES"
      rightElement={
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="hidden sm:block text-[10px] text-zinc-400 font-bold">
              Màj: {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            id="dashboard-refresh-btn"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-black text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-28 md:pb-12">

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={refresh} className="ml-auto underline hover:no-underline">
              Réessayer
            </button>
          </div>
        )}
        {/* Period Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <BarChart2 className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground">Analyse de performance</p>
              <p className="text-[10px] text-zinc-400 font-bold">
                {overview?.kpis?.activeShops ?? "—"} boutiques actives surveillées
              </p>
            </div>
          </div>
          <PeriodSelector query={query} onChange={handleQueryChange} shops={shops} />
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            id="kpi-revenue"
            title="Chiffre d'Affaires"
            value={overview?.kpis?.revenue?.value ?? 0}
            change={overview?.kpis?.revenue?.evolution}
            icon={<DollarSign className="h-5 w-5" />}
            format="currency"
            color="violet"
            loading={loading}
          />
          <KpiCard
            id="kpi-margin"
            title="Marge Brute"
            value={overview?.kpis?.grossMargin?.value ?? 0}
            subtitle={`Taux: ${(overview?.kpis?.grossMargin?.rate ?? 0).toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            format="currency"
            color="emerald"
            loading={loading}
          />
          <KpiCard
            id="kpi-transactions"
            title="Transactions"
            value={overview?.kpis?.transactions?.value ?? 0}
            change={overview?.kpis?.transactions?.evolution}
            icon={<ShoppingCart className="h-5 w-5" />}
            format="number"
            color="blue"
            loading={loading}
          />
          <KpiCard
            id="kpi-customers"
            title="Nouveaux Clients"
            value={overview?.kpis?.newCustomers ?? 0}
            icon={<Users className="h-5 w-5" />}
            format="number"
            color="amber"
            loading={loading}
          />
        </div>

        {/* ── Secondary KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Shops */}
          <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 flex-shrink-0">
              <Building2 className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{loading ? "—" : overview?.kpis?.activeShops ?? 0}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Boutiques actives</p>
            </div>
          </div>
          {/* Credit Outstanding */}
          <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 flex-shrink-0">
              <CreditCard className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <p className="text-base font-black text-foreground leading-tight">
                {loading ? "—" : fmt(overview?.kpis?.creditOutstanding?.amount ?? 0)}
                <span className="text-[10px] font-bold text-zinc-400 ml-1">FCFA</span>
              </p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Crédits en cours ({overview?.kpis?.creditOutstanding?.customersCount ?? 0} clients)
              </p>
            </div>
          </div>
          {/* Average Basket */}
          <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 flex-shrink-0">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-base font-black text-foreground leading-tight">
                {loading ? "—" : fmt(overview?.kpis?.averageBasket ?? 0)}
                <span className="text-[10px] font-bold text-zinc-400 ml-1">FCFA</span>
              </p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Panier moyen
              </p>
            </div>
          </div>
          {/* Expenses */}
          <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 flex-shrink-0">
              <BarChart2 className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-base font-black text-foreground leading-tight">
                {loading ? "—" : fmt(overview?.kpis?.expenses?.value ?? 0)}
                <span className="text-[10px] font-bold text-zinc-400 ml-1">FCFA</span>
              </p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Dépenses période
                {(overview?.kpis?.expenses?.evolution ?? 0) !== 0 && (
                  <span className={`ml-1 ${(overview?.kpis?.expenses?.evolution ?? 0) > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {(overview?.kpis?.expenses?.evolution ?? 0) > 0 ? "↑" : "↓"}{Math.abs(overview?.kpis?.expenses?.evolution ?? 0).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        {/* ── Sales Timeline ── */}
        <SalesTimeline data={timeline} loading={loading} />
        {/* ── Shops + Categories row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ShopsLeaderboard data={shopsPerf} loading={loading} />
          </div>
          <div className="lg:col-span-2">
            <CategoryDonut data={categories} loading={loading} />
          </div>
        </div>

        {/* ── Cashiers Table ── */}
        <CashiersTable data={cashiers} loading={loading} />

        {/* ── Alerts + Financial row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertsPanel data={alerts} loading={loadingAlerts} />
          <FinancialReport data={financial} loading={loading} />
        </div>

        {/* ── Expiration Alerts ── */}
        <ExpirationWidget shops={shops} />

      </div>
    </AppLayout>
  );
}
