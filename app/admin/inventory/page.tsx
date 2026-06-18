"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useShops } from "@/hooks/admin/useShops";
import InventoryDashboardService, {
  InventoryOverviewResponse,
  TopProductsResponse,
  StockValuationResponse,
  InventoryAlertsResponse,
} from "@/services/inventoryDashboard.service";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Package, TrendingUp, AlertTriangle, PackageX,
  RefreshCw, BarChart3, Layers, Clock, ChevronDown,
  Store, AlertCircle,
} from "lucide-react";

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const fmtDec = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);

type Period = "day" | "week" | "month" | "year";
const PERIODS: { label: string; value: Period }[] = [
  { label: "Aujourd'hui", value: "day" },
  { label: "7 jours", value: "week" },
  { label: "Ce mois", value: "month" },
  { label: "Cette année", value: "year" },
];

/* ── Stock cover days coloring ──────────────────────────────── */
function coverColor(days: number | null) {
  if (days === null) return "text-zinc-400";
  if (days < 7) return "text-rose-600 font-black";
  if (days < 30) return "text-amber-600 font-bold";
  return "text-emerald-600 font-bold";
}
function coverBg(days: number | null) {
  if (days === null) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-400";
  if (days < 7) return "bg-rose-100 dark:bg-rose-950/30 text-rose-700";
  if (days < 30) return "bg-amber-100 dark:bg-amber-950/30 text-amber-700";
  return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700";
}

/* ── Skeleton ───────────────────────────────────────────────── */
function Skel({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse ${className}`} />
  );
}

/* ══ PAGE ════════════════════════════════════════════════════ */
export default function InventoryPage() {
  const { shops } = useShops();
  const [shopId, setShopId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(false);
  const [alertTab, setAlertTab] = useState<"outOfStock" | "lowStock" | "dormant">("outOfStock");

  const [overview, setOverview] = useState<InventoryOverviewResponse | null>(null);
  const [products, setProducts] = useState<TopProductsResponse | null>(null);
  const [valuation, setValuation] = useState<StockValuationResponse | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlertsResponse | null>(null);

  // Auto-select first shop
  useEffect(() => {
    if (shops.length > 0 && !shopId) setShopId(shops[0].id);
  }, [shops, shopId]);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const params = { period };
      const [ov, pr, va, al] = await Promise.all([
        InventoryDashboardService.getOverview(shopId, params),
        InventoryDashboardService.getTopProducts(shopId, { ...params, limit: 10 }),
        InventoryDashboardService.getValuation(shopId),
        InventoryDashboardService.getAlerts(shopId, params),
      ]);
      setOverview(ov);
      setProducts(pr);
      setValuation(va);
      setAlerts(al);
    } catch {
      /* silently fail — show empty states */
    } finally {
      setLoading(false);
    }
  }, [shopId, period]);

  useEffect(() => { load(); }, [load]);

  const totalAlerts = alerts?.summary.totalAlerts ?? 0;

  /* ── Donut data ── */
  const donutData = (valuation?.byCategory ?? []).map((c) => ({
    name: c.categoryName,
    value: c.inventoryValue,
    color: c.colorHex,
    share: c.shareOfTotalValue,
  }));

  return (
    <AppLayout title="Inventaire & Stock">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 md:pb-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <BarChart3 className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground">Inventaire & Stock</h1>
              <p className="text-xs text-muted-foreground">Valorisation, performances et alertes produits</p>
            </div>
            {totalAlerts > 0 && (
              <span className="px-2.5 py-1 bg-rose-500 text-white text-[11px] font-black rounded-full animate-pulse">
                {totalAlerts} alerte{totalAlerts > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-black transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Shop selector */}
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-bold text-foreground outline-none cursor-pointer appearance-none focus:border-primary transition-colors"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Period tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  period === p.value
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                    : "text-zinc-500 hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 1 — KPI OVERVIEW
        ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Valeur du stock */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-card p-5 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/3 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10"><Package className="h-4 w-4 text-blue-500" /></div>
              </div>
              {loading ? <Skel className="h-7 w-3/4 mb-1" /> : (
                <p className="text-2xl font-black text-foreground">{fmt(overview?.stock.inventoryValue ?? 0)} <span className="text-sm font-bold text-zinc-400">XOF</span></p>
              )}
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Valeur du stock</p>
              {loading ? <Skel className="h-3 w-1/2 mt-2" /> : (
                <p className="text-[10px] text-zinc-400 mt-1">Revenu potentiel : {fmt(overview?.stock.potentialRevenue ?? 0)} XOF</p>
              )}
            </div>
          </div>

          {/* Bénéfice potentiel */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-card p-5 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/3 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
                {!loading && overview && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg">
                    {overview.stock.potentialProfitRate.toFixed(1)}%
                  </span>
                )}
              </div>
              {loading ? <Skel className="h-7 w-3/4 mb-1" /> : (
                <p className="text-2xl font-black text-foreground">{fmt(overview?.stock.potentialProfit ?? 0)} <span className="text-sm font-bold text-zinc-400">XOF</span></p>
              )}
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Bénéfice potentiel</p>
              {!loading && overview && (
                <p className="text-[10px] text-zinc-400 mt-1">{fmt(overview.stock.totalStockUnits)} unités en stock</p>
              )}
            </div>
          </div>

          {/* Bénéfice réalisé */}
          <div className="rounded-2xl border border-violet-200 dark:border-violet-900/40 bg-card p-5 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-500/3 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-violet-500/10"><BarChart3 className="h-4 w-4 text-violet-500" /></div>
                {!loading && overview && overview.sales.revenue > 0 && (
                  <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 text-[10px] font-black rounded-lg">
                    {overview.sales.grossProfitRate.toFixed(1)}%
                  </span>
                )}
              </div>
              {loading ? <Skel className="h-7 w-3/4 mb-1" /> : (
                <p className="text-2xl font-black text-foreground">{fmt(overview?.sales.grossProfit ?? 0)} <span className="text-sm font-bold text-zinc-400">XOF</span></p>
              )}
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Bénéfice réalisé</p>
              {!loading && overview && (
                <p className="text-[10px] text-zinc-400 mt-1">CA : {fmt(overview.sales.revenue)} XOF · {overview.sales.transactionCount} ventes</p>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI secondaires + alertes ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-border p-4 flex flex-col gap-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Produits actifs</span>
            {loading ? <Skel className="h-6 w-2/3" /> : (
              <span className="text-xl font-black text-foreground">{overview?.stock.totalActiveProducts ?? 0}</span>
            )}
          </div>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-border p-4 flex flex-col gap-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Unités vendues</span>
            {loading ? <Skel className="h-6 w-2/3" /> : (
              <span className="text-xl font-black text-foreground">{fmtDec(overview?.sales.unitsSold ?? 0)}</span>
            )}
          </div>
          {/* Alert: outOfStock */}
          <div className={`rounded-xl border p-4 flex flex-col gap-1 cursor-pointer transition-all hover:opacity-80 ${(overview?.alerts.outOfStock ?? 0) > 0 ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" : "bg-zinc-50 dark:bg-zinc-800/60 border-border"}`}
            onClick={() => setAlertTab("outOfStock")}>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <PackageX className="h-3 w-3" />Rupture totale
            </span>
            {loading ? <Skel className="h-6 w-1/2" /> : (
              <span className="text-xl font-black text-rose-600">{overview?.alerts.outOfStock ?? 0}</span>
            )}
          </div>
          {/* Alert: lowStock */}
          <div className={`rounded-xl border p-4 flex flex-col gap-1 cursor-pointer transition-all hover:opacity-80 ${(overview?.alerts.lowStock ?? 0) > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" : "bg-zinc-50 dark:bg-zinc-800/60 border-border"}`}
            onClick={() => setAlertTab("lowStock")}>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />Stock bas
            </span>
            {loading ? <Skel className="h-6 w-1/2" /> : (
              <span className="text-xl font-black text-amber-600">{overview?.alerts.lowStock ?? 0}</span>
            )}
          </div>
        </div>

        {/* ── Barre stock vs potentiel ── */}
        {!loading && overview && overview.stock.potentialRevenue > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-black text-foreground">Stock immobilisé vs Revenu potentiel</p>
                <p className="text-[11px] text-zinc-400">Rapport entre la valeur d'achat et la valeur de vente</p>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                +{overview.stock.potentialProfitRate.toFixed(1)}% de marge
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 mb-1">
                  <span>Valeur d'achat</span>
                  <span>{fmt(overview.stock.inventoryValue)} XOF</span>
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(overview.stock.inventoryValue / overview.stock.potentialRevenue) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 mb-1">
                  <span>Revenu potentiel</span>
                  <span>{fmt(overview.stock.potentialRevenue)} XOF</span>
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 2 — TOP VENDEURS + VALORISATION
        ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Top vendeurs ── */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-black text-foreground">Top vendeurs</h2>
                {products && (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {products.periodDays}j · {products.topSellers.length} produits
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-4 py-2.5 font-black text-zinc-400">#</th>
                    <th className="text-left px-4 py-2.5 font-black text-zinc-400">Produit</th>
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Unités</th>
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">CA</th>
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Marge</th>
                    <th className="text-center px-4 py-2.5 font-black text-zinc-400">Couv.</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-2.5"><Skel className="h-3 w-4" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-28" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-10 ml-auto" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-16 ml-auto" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-12 ml-auto" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : products?.topSellers.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">Aucune vente sur la période</td></tr>
                  ) : (
                    products?.topSellers.map((p) => (
                      <tr key={p.productId} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-2.5 font-black text-zinc-400">{p.rank}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-foreground leading-tight">{p.productName}</p>
                              {p.categoryName && (
                                <span
                                  className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md mt-0.5"
                                  style={{
                                    background: (p.categoryColor ?? "#94A3B8") + "22",
                                    color: p.categoryColor ?? "#94A3B8",
                                  }}
                                >
                                  {p.categoryName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmtDec(p.unitsSold)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmt(p.revenue)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-black text-emerald-600">{p.grossProfitRate.toFixed(1)}%</span>
                            <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, p.grossProfitRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black ${coverBg(p.stockCoverDays)}`}>
                            {p.stockCoverDays === null ? "—" : `${Math.round(p.stockCoverDays)}j`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Valorisation par catégorie ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-black text-foreground">Stock par catégorie</h2>
            </div>

            {/* Donut */}
            <div className="h-48 flex items-center justify-center">
              {loading ? (
                <div className="h-32 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ) : donutData.length === 0 ? (
                <p className="text-xs text-zinc-400">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-xl p-2.5 shadow-xl text-[11px]">
                            <p className="font-black text-foreground">{d.name}</p>
                            <p className="text-zinc-500">{fmt(d.value)} XOF</p>
                            <p className="text-zinc-400">{d.share.toFixed(1)}% du stock</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Légende catégories */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-4 w-full" />)
              ) : (
                (valuation?.byCategory ?? []).map((c) => (
                  <div key={c.categoryId ?? "none"} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ background: c.colorHex }}
                      />
                      <span className="font-bold text-foreground truncate">{c.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-zinc-400">{c.shareOfTotalValue.toFixed(0)}%</span>
                      <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.shareOfTotalValue}%`, background: c.colorHex }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer totaux */}
            {!loading && valuation && (
              <div className="px-4 pb-4 pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-bold">Total stock</span>
                  <span className="font-black text-foreground">{fmt(valuation.totalInventoryValue)} XOF</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-bold">Profit potentiel</span>
                  <span className="font-black text-emerald-600">{fmt(valuation.totalPotentialProfit)} XOF</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 3 — PRODUITS DORMANTS
        ════════════════════════════════════════════════ */}
        {(loading || (products?.dormantProducts?.length ?? 0) > 0) && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-black text-foreground">Produits dormants</h2>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  Stock immobilisé non vendu
                </span>
              </div>
              {!loading && products && products.dormantProducts.length > 0 && (
                <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                  {fmt(products.dormantProducts.reduce((s, p) => s + p.stockValue, 0))} XOF immobilisés
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-4 py-2.5 font-black text-zinc-400">Produit</th>
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Stock</th>
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Valeur immobilisée</th>
                    <th className="text-center px-4 py-2.5 font-black text-zinc-400">Dernière vente</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-2.5"><Skel className="h-3 w-32" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-10 ml-auto" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-20 ml-auto" /></td>
                        <td className="px-4 py-2.5"><Skel className="h-3 w-16 mx-auto" /></td>
                      </tr>
                    ))
                  ) : products?.dormantProducts.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">Aucun produit dormant</td></tr>
                  ) : (
                    products?.dormantProducts.map((p) => (
                      <tr key={p.productId} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-foreground">{p.productName}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmtDec(p.stockQty)}</td>
                        <td className="px-4 py-2.5 text-right font-black text-amber-600">{fmt(p.stockValue)} XOF</td>
                        <td className="px-4 py-2.5 text-center">
                          {p.daysSinceLastSale === null ? (
                            <span className="inline-block px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[9px] font-black rounded-lg">Jamais vendu</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 text-[9px] font-black rounded-lg">il y a {p.daysSinceLastSale}j</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 4 — ALERTES
        ════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-black text-foreground">Alertes inventaire</h2>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(
              [
                { key: "outOfStock", label: "Ruptures", count: alerts?.summary.outOfStockCount ?? 0, color: "text-rose-600 border-rose-500" },
                { key: "lowStock", label: "Stock bas", count: alerts?.summary.lowStockCount ?? 0, color: "text-amber-600 border-amber-500" },
                { key: "dormant", label: "Dormants", count: alerts?.summary.dormantCount ?? 0, color: "text-zinc-500 border-zinc-400" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAlertTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black border-b-2 transition-all ${
                  alertTab === tab.key ? tab.color : "border-transparent text-zinc-400 hover:text-foreground"
                }`}
              >
                {tab.label}
                {!loading && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    tab.key === "outOfStock" ? "bg-rose-100 dark:bg-rose-950/30 text-rose-600" :
                    tab.key === "lowStock" ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-4 py-2.5 font-black text-zinc-400">Produit</th>
                  <th className="text-left px-4 py-2.5 font-black text-zinc-400">Catégorie</th>
                  {alertTab === "lowStock" && (
                    <th className="text-center px-4 py-2.5 font-black text-zinc-400">Stock / Seuil</th>
                  )}
                  {alertTab === "dormant" && (
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Valeur</th>
                  )}
                  {alertTab !== "dormant" && (
                    <th className="text-right px-4 py-2.5 font-black text-zinc-400">Valeur stock</th>
                  )}
                  {alertTab === "dormant" && (
                    <th className="text-center px-4 py-2.5 font-black text-zinc-400">Dernière vente</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-2.5"><Skel className="h-3 w-32" /></td>
                      <td className="px-4 py-2.5"><Skel className="h-3 w-16" /></td>
                      <td className="px-4 py-2.5"><Skel className="h-3 w-16 ml-auto" /></td>
                      <td className="px-4 py-2.5"><Skel className="h-3 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : alertTab === "outOfStock" ? (
                  alerts?.outOfStock.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-emerald-600 font-bold">Aucune rupture de stock</td></tr>
                  ) : (
                    alerts?.outOfStock.map((p) => (
                      <tr key={p.productId} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-foreground">{p.productName}</span>
                          {p.sku && <span className="ml-2 text-[9px] text-zinc-400">{p.sku}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400">{p.categoryName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-block px-2 py-0.5 bg-rose-100 dark:bg-rose-950/30 text-rose-700 text-[9px] font-black rounded-lg">RUPTURE</span>
                        </td>
                      </tr>
                    ))
                  )
                ) : alertTab === "lowStock" ? (
                  alerts?.lowStock.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-emerald-600 font-bold">Aucun stock bas</td></tr>
                  ) : (
                    alerts?.lowStock.map((p) => (
                      <tr key={p.productId} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-foreground">{p.productName}</span>
                          {p.sku && <span className="ml-2 text-[9px] text-zinc-400">{p.sku}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400">{p.categoryName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-black text-amber-600">{p.stockQty}</span>
                          <span className="text-zinc-400"> / {p.minStockQty}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmt(p.stockValue)} XOF</td>
                      </tr>
                    ))
                  )
                ) : (
                  alerts?.dormantProducts.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">Aucun produit dormant</td></tr>
                  ) : (
                    alerts?.dormantProducts.map((p) => (
                      <tr key={p.productId} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-foreground">{p.productName}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{fmtDec(p.stockQty)} unités</td>
                        <td className="px-4 py-2.5 text-right font-black text-amber-600">{fmt(p.stockValue)} XOF</td>
                        <td className="px-4 py-2.5 text-center">
                          {p.daysSinceLastSale === null ? (
                            <span className="inline-block px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[9px] font-black rounded-lg">Jamais vendu</span>
                          ) : (
                            <span className="text-zinc-500">il y a {p.daysSinceLastSale}j</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          {!loading && alerts && alerts.summary.totalAlerts === 0 && (
            <div className="py-8 flex flex-col items-center gap-2 text-emerald-600">
              <TrendingUp className="h-8 w-8" />
              <p className="text-sm font-black">Aucune alerte — stock en bonne santé !</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
