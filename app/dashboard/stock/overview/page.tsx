"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import InventoryDashboardService, {
  InventoryOverviewResponse,
  StockValuationResponse,
  TopProductsResponse,
  InventoryPeriodParams,
} from "@/services/inventoryDashboard.service";
import { Package, TrendingUp, Layers, RefreshCw } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const PERIODS: { label: string; value: NonNullable<InventoryPeriodParams["period"]> }[] = [
  { label: "Aujourd'hui", value: "day" },
  { label: "Semaine", value: "week" },
  { label: "Mois", value: "month" },
  { label: "Année", value: "year" },
];

export default function StockOverviewPage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [overview, setOverview] = useState<InventoryOverviewResponse | null>(null);
  const [valuation, setValuation] = useState<StockValuationResponse | null>(null);
  const [products, setProducts] = useState<TopProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<NonNullable<InventoryPeriodParams["period"]>>("month");

  const load = async (p = period) => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [ov, val, prod] = await Promise.all([
        InventoryDashboardService.getOverview(shopId, { period: p }),
        InventoryDashboardService.getValuation(shopId),
        InventoryDashboardService.getTopProducts(shopId, { period: p, limit: 10 }),
      ]);
      setOverview(ov);
      setValuation(val);
      setProducts(prod);
    } catch {
      showToast("Impossible de charger l'inventaire", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(period); }, [shopId, period]);

  const maxCatValue = Math.max(1, ...(valuation?.byCategory.map((c) => c.inventoryValue) ?? [1]));

  return (
    <AppLayout
      title="Inventaire & Stock"
      subtitle="Valorisation et performances"
      backUrl="/dashboard"
      rightElement={
        <button onClick={() => load(period)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Sélecteur période ── */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${period === p.value ? "bg-white dark:bg-zinc-900 shadow-sm text-primary" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── KPIs stock ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Produits Actifs", value: loading ? "—" : String(overview?.stock.totalActiveProducts ?? 0), icon: <Package className="h-4 w-4" />, color: "bg-primary/10 text-primary" },
            { label: "Unités en Stock", value: loading ? "—" : fmt(overview?.stock.totalStockUnits ?? 0), icon: <Layers className="h-4 w-4" />, color: "bg-violet-500/10 text-violet-600" },
            { label: "Valeur Inventaire", value: loading ? "—" : `${fmt(overview?.stock.inventoryValue ?? 0)} XOF`, icon: <TrendingUp className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "CA Période", value: loading ? "—" : `${fmt(overview?.sales.revenue ?? 0)} XOF`, icon: <TrendingUp className="h-4 w-4" />, color: "bg-amber-500/10 text-amber-600" },
            { label: "Bénéfice Brut", value: loading ? "—" : `${fmt(overview?.sales.grossProfit ?? 0)} XOF`, icon: <TrendingUp className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Taux de Marge", value: loading ? "—" : `${overview?.sales.grossProfitRate ?? 0}%`, icon: <TrendingUp className="h-4 w-4" />, color: "bg-rose-500/10 text-rose-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-tight">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
              </div>
              <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* ── Valorisation par catégorie ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Valorisation par Catégorie</h3>
          </div>
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
          ) : (valuation?.byCategory ?? []).length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-bold">Aucune donnée</div>
          ) : (
            <div className="px-5 py-4 flex flex-col gap-4">
              {valuation!.byCategory.map((c) => {
                const pct = Math.round((c.inventoryValue / maxCatValue) * 100);
                return (
                  <div key={c.categoryId ?? c.categoryName}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.colorHex || "#6366f1" }} />
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">{c.categoryName}</span>
                        <span className="text-[10px] font-bold text-zinc-400">{c.productCount} produits</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black">
                        <span className="text-zinc-400">{c.shareOfTotalValue}%</span>
                        <span className="text-primary">{fmt(c.inventoryValue)} XOF</span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: c.colorHex || "#6366f1" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top 10 Produits ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Top 10 Produits
            </h3>
          </div>
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
          ) : (products?.topSellers ?? []).length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-bold">Aucune vente sur cette période</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-black">#</th>
                    <th className="px-3 py-3 text-left font-black">Produit</th>
                    <th className="px-3 py-3 text-center font-black">Vendus</th>
                    <th className="px-3 py-3 text-right font-black">CA</th>
                    <th className="px-3 py-3 text-right font-black">Marge %</th>
                    <th className="px-3 py-3 text-right font-black">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {products!.topSellers.map((p) => (
                    <tr key={p.productId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-2.5 text-zinc-300 dark:text-zinc-600 font-black">#{p.rank}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-black text-zinc-800 dark:text-zinc-100">{p.productName}</p>
                        {p.categoryName && <p className="text-[10px] font-bold text-zinc-400">{p.categoryName}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{p.unitsSold}</td>
                      <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(p.revenue)} XOF</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-black ${p.grossProfitRate >= 20 ? "text-emerald-600" : p.grossProfitRate >= 10 ? "text-amber-500" : "text-red-500"}`}>
                          {p.grossProfitRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-zinc-500">{p.stockQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
