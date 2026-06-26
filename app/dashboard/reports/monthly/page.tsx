"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService from "@/services/reports.service";
import { MonthlyReport } from "@/types/reports";
import {
  BarChart2, TrendingUp, TrendingDown, Package,
  Tag, AlertTriangle, RefreshCw,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const growthColor = (pct: number) =>
  pct > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
  : pct < 0 ? "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
  : "text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-700";
const formatGrowth = (pct: number) => (pct >= 0 ? "+" : "") + pct + "%";

const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

export default function MonthlyReportPage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const load = async (m = month, y = year) => {
    if (!shopId) return;
    setLoading(true);
    try {
      setData(await ReportsService.getMonthly(shopId, m, y));
    } catch {
      showToast("Impossible de charger le rapport mensuel", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(month, year); }, [shopId, month, year]);

  const maxBar = Math.max(1, ...(data?.weeklyBreakdown.map((w) => w.revenue) ?? [1]));

  const periodRow = (label: string, cur: number | undefined, prev: number | undefined) => (
    <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0">
      <span className="text-xs font-bold text-zinc-500">{label}</span>
      <div className="flex items-center gap-6">
        <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 w-32 text-right">{loading ? "—" : fmt(cur ?? 0)} XOF</span>
        <span className="text-xs font-bold text-zinc-400 w-32 text-right">{loading ? "—" : fmt(prev ?? 0)} XOF</span>
      </div>
    </div>
  );

  return (
    <AppLayout
      title="Rapport Mensuel"
      subtitle={data?.monthLabel ?? "Chargement…"}
      backUrl="/dashboard"
      rightElement={
        <button onClick={() => load(month, year)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Sélecteur mois/année ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 shadow-sm">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 shadow-sm">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none cursor-pointer"
            >
              {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Badges de croissance ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Croissance CA", pct: data?.revenueGrowth ?? 0 },
            { label: "Croissance Marge", pct: data?.marginGrowth ?? 0 },
          ].map((b) => (
            <div key={b.label} className={`flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border ${loading ? "bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-700 text-zinc-400" : growthColor(b.pct)}`}>
              <span className="text-[10px] font-black uppercase tracking-wider">{b.label}</span>
              <div className="flex items-center gap-1">
                {!loading && (b.pct > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : b.pct < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null)}
                <span className="text-sm font-black">{loading ? "—" : formatGrowth(b.pct)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Comparaison mois ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Comparaison Mois</h3>
              <div className="flex items-center gap-4 text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                <span>Mois Courant</span>
                <span>Mois Précédent</span>
              </div>
            </div>
          </div>
          <div className="px-5 py-3">
            {periodRow("Chiffre d'Affaires", data?.currentMonth.revenue, data?.previousMonth.revenue)}
            {periodRow("Marge Brute", data?.currentMonth.grossMargin, data?.previousMonth.grossMargin)}
            {periodRow("Dépenses", data?.currentMonth.expenses, data?.previousMonth.expenses)}
            {periodRow("Bénéfice Net", data?.currentMonth.netRevenue, data?.previousMonth.netRevenue)}
          </div>
        </div>

        {/* ── Graphique barres hebdomadaire ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> CA par Semaine
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.weeklyBreakdown ?? []).length === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-400 text-xs font-bold">Aucune donnée</div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <span className="text-[9px] font-bold text-zinc-400">{fmt(maxBar)} XOF</span>
                </div>
                <div className="flex items-end gap-3" style={{ height: 100 }}>
                  {data!.weeklyBreakdown.map((w) => {
                    const hRev = Math.max(4, Math.round((w.revenue / maxBar) * 90));
                    const hMar = Math.max(2, Math.round((w.margin / maxBar) * 90));
                    return (
                      <div key={w.week} className="flex flex-col items-center flex-1 justify-end h-full">
                        <div className="w-full flex flex-col items-center justify-end h-full relative">
                          <div
                            className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative overflow-hidden"
                            style={{ height: hRev }}
                            title={`${w.week} — CA: ${fmt(w.revenue)} XOF`}
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                              style={{ height: hMar }}
                              title={`Marge: ${fmt(w.margin)} XOF`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2">
                  {data!.weeklyBreakdown.map((w) => (
                    <span key={w.week} className="flex-1 text-[9px] font-bold text-zinc-400 text-center truncate">{w.week}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── Top Produits ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-4 w-4" /> Top Produits du Mois
              </h3>
            </div>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.topProducts ?? []).length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Aucune vente ce mois</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-black">#</th>
                      <th className="px-3 py-2 text-left font-black">Produit</th>
                      <th className="px-3 py-2 text-center font-black">Qté</th>
                      <th className="px-3 py-2 text-right font-black">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data!.topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-300 dark:text-zinc-600 font-black">#{i + 1}</td>
                        <td className="px-3 py-2.5 font-black text-zinc-800 dark:text-zinc-100">{p.name}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{p.qty}</td>
                        <td className="px-3 py-2.5 text-right font-black text-emerald-600">{fmt(p.margin)} XOF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Top Catégories ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-4 w-4" /> Top Catégories
              </h3>
            </div>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.topCategories ?? []).length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Aucune donnée</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-black">Catégorie</th>
                      <th className="px-3 py-2 text-right font-black">CA</th>
                      <th className="px-3 py-2 text-right font-black">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data!.topCategories.map((c, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5 font-black text-zinc-800 dark:text-zinc-100">{c.name}</td>
                        <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(c.revenue)} XOF</td>
                        <td className="px-3 py-2.5 text-right font-black text-emerald-600">{fmt(c.margin)} XOF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Stock bas ── */}
        {!loading && (data?.lowStockProducts ?? []).length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40">
              <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stock Bas — {data!.lowStockProducts.length} produit{data!.lowStockProducts.length > 1 ? "s" : ""}
              </h3>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {data!.lowStockProducts.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/40 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  {p.name} <span className="font-black">{p.stock} {p.unit}</span>
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
