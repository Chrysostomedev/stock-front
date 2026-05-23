"use client";

import React from "react";
import { FinancialReportResponse } from "@/types/dashboard";
import { DollarSign, TrendingUp, TrendingDown, ReceiptText, Minus } from "lucide-react";

interface FinancialReportProps {
  data: FinancialReportResponse | null;
  loading: boolean;
}

function MetricRow({
  label,
  value,
  sublabel,
  color = "default",
  progress,
}: {
  label: string;
  value: string;
  sublabel?: string;
  color?: "default" | "green" | "red" | "amber";
  progress?: number;
}) {
  const valueColor = {
    default: "text-foreground",
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-rose-600 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
  }[color];

  const barColor = {
    default: "bg-violet-500",
    green: "bg-emerald-500",
    red: "bg-rose-500",
    amber: "bg-amber-500",
  }[color];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500">{label}</span>
        <div className="text-right">
          <span className={`text-sm font-black ${valueColor}`}>{value}</span>
          {sublabel && <p className="text-[10px] text-zinc-400 font-bold">{sublabel}</p>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function FinancialReport({ data, loading }: FinancialReportProps) {
  // Accès via data.pnl (structure réelle confirmée)
  const pnl = data?.pnl;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n ?? 0) +
    ` ${data?.currency ?? "FCFA"}`;

  const grossRevenue = pnl?.revenue?.gross ?? 0;
  const discounts   = pnl?.revenue?.discounts ?? 0;
  const netRevenue  = pnl?.revenue?.net ?? 0;
  const cogs        = pnl?.cogs?.value ?? 0;
  const cogsRate    = pnl?.cogs?.rate ?? 0;
  const margin      = pnl?.grossMargin?.value ?? 0;
  const marginRate  = pnl?.grossMargin?.rate ?? 0;
  const expenses    = pnl?.expenses?.total ?? 0;
  const byCategory  = pnl?.expenses?.byCategory ?? [];
  const netResult   = pnl?.netResult?.value ?? 0;
  const netMargin   = pnl?.netResult?.margin ?? 0;
  const isProfit    = pnl?.netResult?.isProfit ?? true;
  const prevRevenue = data?.previousPeriod?.revenue ?? 0;

  const revenueChange = prevRevenue > 0
    ? ((grossRevenue - prevRevenue) / prevRevenue) * 100
    : 0;

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <ReceiptText className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Rapport Financier P&L</h3>
            <p className="text-[10px] text-zinc-400 font-bold">Pertes & Profits consolidés</p>
          </div>
        </div>

        {/* Résultat net badge */}
        {data && !loading && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isProfit
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400"
          }`}>
            {isProfit ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span className="text-[10px] font-black">
              {isProfit ? "Bénéfice" : "Déficit"}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="py-10 flex flex-col items-center text-zinc-400 gap-2">
          <DollarSign className="h-10 w-10 opacity-20" />
          <p className="text-xs font-bold">Aucune donnée financière</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* CA Brut */}
          <MetricRow
            label="CA Brut"
            value={fmt(grossRevenue)}
            sublabel={revenueChange !== 0 ? `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs période préc.` : undefined}
            color="default"
            progress={100}
          />

          {/* Remises */}
          {discounts > 0 && (
            <MetricRow
              label="Remises accordées"
              value={`-${fmt(discounts)}`}
              color="amber"
              progress={grossRevenue > 0 ? (discounts / grossRevenue) * 100 : 0}
            />
          )}

          {/* COGS */}
          <MetricRow
            label="Coût des marchandises (COGS)"
            value={`-${fmt(cogs)}`}
            sublabel={`${cogsRate.toFixed(1)}% du CA`}
            color="red"
            progress={Math.min(cogsRate, 100)}
          />

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Marge brute */}
          <MetricRow
            label="Marge brute"
            value={fmt(margin)}
            sublabel={`Taux: ${marginRate.toFixed(1)}%`}
            color="green"
            progress={Math.max(marginRate, 0)}
          />

          {/* Dépenses */}
          <MetricRow
            label="Dépenses opérationnelles"
            value={`-${fmt(expenses)}`}
            color="amber"
            progress={margin > 0 ? (expenses / margin) * 100 : expenses > 0 ? 100 : 0}
          />

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Résultat net — mis en avant */}
          <div className={`p-4 rounded-xl border ${
            isProfit
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-foreground">Résultat Net</span>
              <div className="text-right">
                <p className={`text-xl font-black ${isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {netResult < 0 ? "-" : ""}{fmt(Math.abs(netResult))}
                </p>
                <p className="text-[10px] text-zinc-500 font-bold">
                  Marge nette: {netMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Détail dépenses par catégorie */}
          {byCategory.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">
                Détail dépenses
              </p>
              <div className="space-y-1.5">
                {byCategory.map((exp) => (
                  <div key={exp.category} className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 capitalize">
                      {exp.category}
                    </span>
                    <span className="text-[10px] font-black text-foreground">{fmt(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
