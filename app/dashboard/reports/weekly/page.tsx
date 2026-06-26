"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService from "@/services/reports.service";
import { WeeklyReport } from "@/types/reports";
import { BarChart2, TrendingUp, TrendingDown, Package, RefreshCw } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const growthColor = (pct: number) =>
  pct > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
  : pct < 0 ? "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
  : "text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-700";

const formatGrowth = (pct: number) => (pct >= 0 ? "+" : "") + pct + "%";

export default function WeeklyReportPage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      setData(await ReportsService.getWeekly(shopId));
    } catch {
      showToast("Impossible de charger le rapport hebdomadaire", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [shopId]);

  const maxBar = Math.max(1, ...(data?.dailyBreakdown.map((d) => d.revenue) ?? [1]));

  const periodCard = (label: string, stats: WeeklyReport["currentWeek"] | undefined) => (
    <div className="flex flex-col gap-3 p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</h4>
      {[
        { label: "CA", value: stats?.revenue ?? 0 },
        { label: "Marge Brute", value: stats?.grossMargin ?? 0 },
        { label: "Dépenses", value: stats?.expenses ?? 0 },
        { label: "Bénéfice Net", value: stats?.netRevenue ?? 0 },
      ].map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500">{row.label}</span>
          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{loading ? "—" : fmt(row.value)} XOF</span>
        </div>
      ))}
    </div>
  );

  return (
    <AppLayout
      title="Rapport Hebdomadaire"
      subtitle={data?.weekLabel ?? "Chargement…"}
      backUrl="/dashboard"
      rightElement={
        <button onClick={load} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Badges de croissance ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "CA", pct: data?.revenueGrowth ?? 0 },
            { label: "Marge", pct: data?.marginGrowth ?? 0 },
            { label: "Ventes", pct: data?.salesGrowth ?? 0 },
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

        {/* ── Comparaison semaines ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {periodCard("Semaine Courante", data?.currentWeek)}
          {periodCard("Semaine Précédente", data?.previousWeek)}
        </div>

        {/* ── Graphique barres journalier ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> CA par Jour de la Semaine
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.dailyBreakdown ?? []).length === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-400 text-xs font-bold">Aucune donnée</div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <span className="text-[9px] font-bold text-zinc-400">{fmt(maxBar)} XOF</span>
                </div>
                <div className="flex items-end gap-2" style={{ height: 100 }}>
                  {data!.dailyBreakdown.map((d) => {
                    const hRev = Math.max(4, Math.round((d.revenue / maxBar) * 90));
                    const hMar = Math.max(2, Math.round((d.margin / maxBar) * 90));
                    return (
                      <div key={d.day} className="group flex flex-col items-center flex-1 justify-end h-full gap-0.5">
                        <div className="w-full flex flex-col items-center justify-end gap-0 h-full relative">
                          <div
                            className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg relative overflow-hidden"
                            style={{ height: hRev }}
                            title={`${d.day} — CA: ${fmt(d.revenue)} XOF`}
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                              style={{ height: hMar }}
                              title={`Marge: ${fmt(d.margin)} XOF`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  {data!.dailyBreakdown.map((d) => (
                    <span key={d.day} className="flex-1 text-[9px] font-bold text-zinc-400 text-center">{d.day}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-5 rounded bg-primary/20 dark:bg-primary/10" />
                    <span className="text-[9px] font-bold text-zinc-400">CA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-5 rounded bg-primary" />
                    <span className="text-[9px] font-bold text-zinc-400">Marge</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Top 5 Produits ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Package className="h-4 w-4" /> Top 5 Produits de la Semaine
            </h3>
          </div>
          {loading ? (
            <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
          ) : (data?.topProducts ?? []).length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs font-bold">Aucune vente cette semaine</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-2 text-left font-black">#</th>
                    <th className="px-3 py-2 text-left font-black">Produit</th>
                    <th className="px-3 py-2 text-center font-black">Qté</th>
                    <th className="px-3 py-2 text-right font-black">CA</th>
                    <th className="px-3 py-2 text-right font-black">Marge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data!.topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-2.5 text-zinc-300 dark:text-zinc-600 font-black">#{i + 1}</td>
                      <td className="px-3 py-2.5 font-black text-zinc-800 dark:text-zinc-100">{p.name}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{p.qty}</td>
                      <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(p.revenue)} XOF</td>
                      <td className="px-3 py-2.5 text-right font-black text-emerald-600">{fmt(p.margin)} XOF</td>
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
