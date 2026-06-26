"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService from "@/services/reports.service";
import { DashboardSummary } from "@/types/reports";
import {
  TrendingUp, ShoppingBag, Percent, Banknote,
  AlertTriangle, Package, RefreshCw, ChevronRight,
  BarChart2, FileText, Calendar, Bell,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const paymentLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
  CREDIT: "Crédit client",
};

const marginColor = (pct: number) =>
  pct >= 20 ? "text-emerald-600" : pct >= 10 ? "text-amber-500" : "text-red-500";

export default function DashboardHomePage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await ReportsService.getSummary(shopId);
      setData(res);
    } catch {
      showToast("Impossible de charger le résumé du jour", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [shopId]);

  const today = data?.today;
  const maxPayment = Math.max(1, ...(data?.paymentBreakdown.map((p) => p.amount) ?? [1]));

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Vue d'ensemble de votre boutique"
      rightElement={
        <button
          onClick={load}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "CA du Jour",
              value: loading ? "—" : `${fmt(today?.revenue ?? 0)} XOF`,
              icon: <TrendingUp className="h-4 w-4" />,
              bg: "bg-emerald-500/10 text-emerald-600",
            },
            {
              label: "Nb Ventes",
              value: loading ? "—" : String(today?.sales ?? 0),
              icon: <ShoppingBag className="h-4 w-4" />,
              bg: "bg-primary/10 text-primary",
            },
            {
              label: "Marge Brute",
              value: loading ? "—" : `${today?.grossMarginPct ?? 0}%`,
              icon: <Percent className="h-4 w-4" />,
              bg: "bg-amber-500/10 text-amber-600",
              valueClass: loading ? "" : marginColor(today?.grossMarginPct ?? 0),
            },
            {
              label: "Bénéfice Net",
              value: loading ? "—" : `${fmt(today?.netRevenue ?? 0)} XOF`,
              icon: <Banknote className="h-4 w-4" />,
              bg: "bg-violet-500/10 text-violet-600",
              valueClass: !loading && (today?.netRevenue ?? 0) < 0 ? "text-red-500" : "",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
              </div>
              <span className={`text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 ${kpi.valueClass ?? ""}`}>
                {kpi.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Alerte stock ── */}
        {!loading && data && (data.lowStockAlert.count > 0 || data.lowStockAlert.critical > 0) && (
          <Link href="/dashboard/stock/alerts">
            <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
              data.lowStockAlert.critical > 0
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 shrink-0 ${data.lowStockAlert.critical > 0 ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  {data.lowStockAlert.critical > 0 && (
                    <p className="text-xs font-black text-red-700 dark:text-red-400">
                      {data.lowStockAlert.critical} produit{data.lowStockAlert.critical > 1 ? "s" : ""} en rupture de stock
                    </p>
                  )}
                  {data.lowStockAlert.count > data.lowStockAlert.critical && (
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {data.lowStockAlert.count} produit{data.lowStockAlert.count > 1 ? "s" : ""} sous le seuil minimum
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── Top 3 produits ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-400" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Top Produits du Jour</h3>
            </div>
            {loading ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.topProducts ?? []).length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Aucune vente aujourd'hui</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(data?.topProducts ?? []).slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-zinc-400">{p.qty} unité{p.qty > 1 ? "s" : ""}</span>
                      <span className="text-xs font-black text-primary">{fmt(p.revenue)} XOF</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Répartition paiements ── */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-zinc-400" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Modes de Paiement</h3>
            </div>
            {loading ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.paymentBreakdown ?? []).length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Aucune vente aujourd'hui</div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-3">
                {(data?.paymentBreakdown ?? []).map((p) => {
                  const pct = Math.round((p.amount / maxPayment) * 100);
                  return (
                    <div key={p.method} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-600 dark:text-zinc-400">{paymentLabel[p.method] ?? p.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800 dark:text-zinc-200">{fmt(p.amount)} XOF</span>
                          <span className="text-[10px] text-zinc-400">({p.count})</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation rapide vers les rapports ── */}
        <div>
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Rapports & Analyses</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Rapport Journalier", sub: "CA, marge, dépenses du jour", href: "/dashboard/reports/daily", icon: <Calendar className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-500/10" },
              { label: "Rapport Hebdomadaire", sub: "Semaine courante vs précédente", href: "/dashboard/reports/weekly", icon: <BarChart2 className="h-5 w-5" />, color: "text-primary bg-primary/10" },
              { label: "Rapport Mensuel", sub: "Synthèse du mois", href: "/dashboard/reports/monthly", icon: <FileText className="h-5 w-5" />, color: "text-violet-600 bg-violet-500/10" },
              { label: "Stock — Alertes", sub: "Ruptures, stock bas, dormants", href: "/dashboard/stock/alerts", icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-500 bg-red-500/10" },
              { label: "Stock — Inventaire", sub: "Valorisation et top produits", href: "/dashboard/stock/overview", icon: <Package className="h-5 w-5" />, color: "text-amber-600 bg-amber-500/10" },
              // { label: "Abonnements Email", sub: "Rapports automatiques", href: "/dashboard/reports/subscriptions", icon: <Bell className="h-5 w-5" />, color: "text-zinc-600 bg-zinc-500/10" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 leading-snug">{item.label}</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-0.5 leading-tight">{item.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-200 group-hover:text-zinc-400 ml-auto shrink-0 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
