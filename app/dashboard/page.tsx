"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService from "@/services/reports.service";
import { DashboardSummary } from "@/types/reports";
import {
  ShoppingBag, Percent, Banknote,
  AlertTriangle, Package, RefreshCw, ChevronRight,
  BarChart2, FileText, Calendar,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const paymentLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
  CREDIT: "Crédit client",
};

const paymentDot: Record<string, string> = {
  CASH: "bg-emerald-500",
  MOBILE_MONEY: "bg-violet-500",
  CARD: "bg-blue-400",
  CREDIT: "bg-amber-500",
};

const paymentBar: Record<string, string> = {
  CASH: "bg-emerald-500",
  MOBILE_MONEY: "bg-violet-500",
  CARD: "bg-blue-400",
  CREDIT: "bg-amber-500",
};

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
  const totalPayments = (data?.paymentBreakdown ?? []).reduce((s, p) => s + p.amount, 0) || 1;
  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Vue d'ensemble de votre boutique"
      rightElement={
        <button
          onClick={load}
          className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 sm:p-8 shadow-xl shadow-blue-500/25">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
            <div className="absolute -bottom-14 -left-8 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute right-1/3 top-1/2 h-20 w-20 rounded-full bg-white/10" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                Chiffre d&apos;affaires du jour
              </p>
              {loading ? (
                <div className="mt-2 h-10 w-48 animate-pulse rounded-xl bg-white/20" />
              ) : (
                <p className="mt-1 text-4xl font-black leading-none text-white sm:text-5xl">
                  {fmt(today?.revenue ?? 0)}
                  <span className="ml-2 text-lg font-bold text-blue-200">XOF</span>
                </p>
              )}
              <p className="mt-2 text-xs font-bold capitalize text-blue-300">{todayLabel}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Ventes</p>
              {loading ? (
                <div className="mt-2 h-8 w-16 animate-pulse rounded-xl bg-white/20" />
              ) : (
                <p className="mt-1 text-3xl font-black text-white">{today?.sales ?? 0}</p>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent className="h-3 w-3 text-blue-200" />
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Marge Brute</p>
              </div>
              {loading ? (
                <div className="h-6 w-16 animate-pulse rounded-lg bg-white/20" />
              ) : (
                <p className={`text-xl font-black ${
                  (today?.grossMarginPct ?? 0) >= 20
                    ? "text-emerald-300"
                    : (today?.grossMarginPct ?? 0) >= 10
                    ? "text-amber-300"
                    : "text-red-300"
                }`}>
                  {today?.grossMarginPct ?? 0}%
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Banknote className="h-3 w-3 text-blue-200" />
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Bénéfice Net</p>
              </div>
              {loading ? (
                <div className="h-6 w-28 animate-pulse rounded-lg bg-white/20" />
              ) : (
                <p className={`text-xl font-black ${
                  (today?.netRevenue ?? 0) < 0 ? "text-red-300" : "text-white"
                }`}>
                  {fmt(today?.netRevenue ?? 0)}
                  <span className="ml-1 text-sm font-bold text-blue-200">XOF</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Alerte stock ── */}
        {!loading && data && (data.lowStockAlert.count > 0 || data.lowStockAlert.critical > 0) && (
          <Link href="/dashboard/stock/alerts">
            <div className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              data.lowStockAlert.critical > 0
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-xl p-2 ${
                  data.lowStockAlert.critical > 0
                    ? "bg-red-100 dark:bg-red-900/40"
                    : "bg-amber-100 dark:bg-amber-900/40"
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    data.lowStockAlert.critical > 0 ? "text-red-500" : "text-amber-500"
                  }`} />
                </div>
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
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" />
            </div>
          </Link>
        )}

        {/* ── Top produits + Paiements ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Top produits */}
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/30">
                  <Package className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                  Top Produits
                </h3>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Aujourd&apos;hui</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : (data?.topProducts ?? []).length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-zinc-400">
                Aucune vente aujourd&apos;hui
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-3">
                {(data?.topProducts ?? []).slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <span className="text-[10px] font-black text-blue-600">{i + 1}</span>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-zinc-800 dark:text-zinc-100">
                      {p.name}
                    </span>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-xs font-black text-blue-600">{fmt(p.revenue)} XOF</span>
                      <span className="text-[9px] font-bold text-zinc-400">
                        {p.qty} unité{p.qty > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modes de paiement */}
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/30">
                  <Banknote className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                  Paiements
                </h3>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Répartition</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4 px-5 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : (data?.paymentBreakdown ?? []).length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-zinc-400">
                Aucune vente aujourd&apos;hui
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-5 py-4">
                {(data?.paymentBreakdown ?? []).map((p) => {
                  const pct = Math.round((p.amount / maxPayment) * 100);
                  const sharePct = Math.round((p.amount / totalPayments) * 100);
                  const dot = paymentDot[p.method] ?? "bg-blue-500";
                  const bar = paymentBar[p.method] ?? "bg-blue-500";
                  return (
                    <div key={p.method}>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {paymentLabel[p.method] ?? p.method}
                          </span>
                          <span className="text-[10px] text-zinc-400">({p.count})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-zinc-800 dark:text-zinc-200">{fmt(p.amount)}</span>
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-black text-zinc-500 dark:bg-zinc-800">
                            {sharePct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation rapide ── */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            <span className="px-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Rapports &amp; Analyses
            </span>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              {
                label: "Journalier",
                sub: "CA, marge, dépenses",
                href: "/dashboard/reports/daily",
                icon: <Calendar className="h-5 w-5" />,
                gradient: "from-emerald-500 to-emerald-600",
              },
              {
                label: "Hebdomadaire",
                sub: "Semaine vs précédente",
                href: "/dashboard/reports/weekly",
                icon: <BarChart2 className="h-5 w-5" />,
                gradient: "from-blue-500 to-blue-700",
              },
              {
                label: "Mensuel",
                sub: "Synthèse du mois",
                href: "/dashboard/reports/monthly",
                icon: <FileText className="h-5 w-5" />,
                gradient: "from-violet-500 to-violet-700",
              },
              {
                label: "Stock — Alertes",
                sub: "Ruptures & stock bas",
                href: "/dashboard/stock/alerts",
                icon: <AlertTriangle className="h-5 w-5" />,
                gradient: "from-red-500 to-red-600",
              },
              {
                label: "Stock — Inventaire",
                sub: "Valorisation & top produits",
                href: "/dashboard/stock/overview",
                icon: <Package className="h-5 w-5" />,
                gradient: "from-amber-500 to-orange-500",
              },
              {
                label: "Caissiers",
                sub: "Performance individuelle",
                href: "/dashboard/cashier",
                icon: <ShoppingBag className="h-5 w-5" />,
                gradient: "from-sky-500 to-blue-600",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900/50">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-sm mx-auto sm:mx-0`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-xs font-black leading-snug text-zinc-800 dark:text-zinc-100">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold leading-tight text-zinc-400">
                      {item.sub}
                    </p>
                  </div>
                  <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-200 transition-colors group-hover:text-blue-400 dark:text-zinc-700" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
