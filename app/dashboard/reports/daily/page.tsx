"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService from "@/services/reports.service";
import { DailyReport } from "@/types/reports";
import {
  Calendar, TrendingUp, Package, Banknote,
  AlertTriangle, RefreshCw, ArrowLeft,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const marginColor = (pct: number) =>
  pct >= 20 ? "text-emerald-600" : pct >= 10 ? "text-amber-500" : "text-red-500";
const paymentLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
  CREDIT: "Crédit client",
};

export default function DailyReportPage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const load = async (d = date) => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await ReportsService.getDaily(shopId, d);
      setData(res);
    } catch {
      showToast("Impossible de charger le rapport journalier", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(date); }, [shopId, date]);

  /* Cascade financière */
  const steps = data
    ? [
        { label: "Chiffre d'Affaires", value: data.totalRevenue, color: "bg-emerald-500", sign: "" },
        { label: "Coût des Marchandises (COGS)", value: -data.cogs, color: "bg-red-400", sign: "−" },
        { label: `Marge Brute (${data.grossMarginPct}%)`, value: data.grossMargin, color: "bg-primary", sign: "=" },
        { label: "Dépenses Opérationnelles", value: -data.totalExpenses, color: "bg-orange-400", sign: "−" },
        { label: "Bénéfice Net", value: data.netRevenue, color: data.netRevenue >= 0 ? "bg-emerald-600" : "bg-red-600", sign: "=" },
      ]
    : [];

  const maxStep = Math.max(1, ...(steps.map((s) => Math.abs(s.value))));

  return (
    <AppLayout
      title="Rapport Journalier"
      subtitle={data ? data.date : "Chargement…"}
      backUrl="/dashboard"
      rightElement={
        <button onClick={() => load(date)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Sélecteur de date ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 shadow-sm">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none cursor-pointer"
            />
          </div>
          {date !== today && (
            <button
              onClick={() => setDate(today)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Aujourd'hui
            </button>
          )}
        </div>

        {/* ── Cascade financière ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Cascade Financière
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 text-[10px] font-black text-zinc-400 text-right shrink-0">{s.sign}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-zinc-500">{s.label}</span>
                    <span className={`text-sm font-black ${s.value < 0 ? "text-red-500" : "text-zinc-800 dark:text-zinc-100"}`}>
                      {s.value < 0 ? `−${fmt(-s.value)}` : fmt(s.value)} XOF
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color} transition-all duration-700`}
                      style={{ width: `${Math.round((Math.abs(s.value) / maxStep) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── Top 5 Produits ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-4 w-4" /> Top 5 Produits
              </h3>
            </div>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.topProducts ?? []).length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Aucune vente</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-black">Produit</th>
                      <th className="px-3 py-2 text-center font-black">Qté</th>
                      <th className="px-3 py-2 text-right font-black">CA</th>
                      <th className="px-3 py-2 text-right font-black">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(data?.topProducts ?? []).map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-black text-zinc-800 dark:text-zinc-100">{p.name}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{p.qty}</td>
                        <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(p.revenue)}</td>
                        <td className={`px-3 py-2.5 text-right font-black ${marginColor(p.margin)}`}>
                          {fmt(p.margin)} XOF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Répartition paiements ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Modes de Paiement
              </h3>
            </div>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.paymentBreakdown ?? []).length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">Aucune vente</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-black">Méthode</th>
                      <th className="px-3 py-2 text-center font-black">Transactions</th>
                      <th className="px-3 py-2 text-right font-black">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(data?.paymentBreakdown ?? []).map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5 font-black text-zinc-800 dark:text-zinc-100">
                          {paymentLabel[p.method] ?? p.method}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{p.count}</td>
                        <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(p.amount)} XOF</td>
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
            <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
              <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stock Bas — {data!.lowStockProducts.length} produit{data!.lowStockProducts.length > 1 ? "s" : ""}
              </h3>
              <Link href="/dashboard/stock/alerts" className="text-[10px] font-black text-amber-600 hover:underline uppercase tracking-wider">
                Voir tous →
              </Link>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {data!.lowStockProducts.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/40 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  {p.name}
                  <span className="font-black">{p.stock} {p.unit}</span>
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
