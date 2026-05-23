"use client";

import React, { useState } from "react";
import { CashiersPerformanceResponse } from "@/types/dashboard";
import { Users, Medal, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface CashiersTableProps {
  data: CashiersPerformanceResponse | null;
  loading: boolean;
}

// Champs réels du backend (confirmés par logs)
type SortField = "revenue" | "transactions" | "totalDiscounts" | "voidedSales";
type SortDir = "asc" | "desc";

export default function CashiersTable({ data, loading }: CashiersTableProps) {
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const cashiers = data?.cashiers
    ? [...data.cashiers].sort((a, b) => {
        const diff = (a[sortField] ?? 0) - (b[sortField] ?? 0);
        return sortDir === "desc" ? -diff : diff;
      })
    : [];

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ChevronsUpDown className="h-3 w-3 text-zinc-400" />;
    return sortDir === "desc"
      ? <ChevronDown className="h-3 w-3 text-violet-500" />
      : <ChevronUp className="h-3 w-3 text-violet-500" />;
  };

  const COLS: { label: string; field?: SortField; align?: string }[] = [
    { label: "Rang" },
    { label: "Caissier / Boutique" },
    { label: "CA", field: "revenue", align: "text-right" },
    { label: "Ventes", field: "transactions", align: "text-right" },
    { label: "Remises", field: "totalDiscounts", align: "text-right" },
    { label: "Annul.", field: "voidedSales", align: "text-right" },
  ];

  const RANK_COLORS = ["text-amber-500", "text-zinc-400", "text-orange-500"];

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n ?? 0);
  const fmtNum = (n: number) =>
    new Intl.NumberFormat("fr-FR").format(n ?? 0);

  // Summary from backend
  const summary = data?.summary;

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Performance Caissiers</h3>
            <p className="text-[10px] text-zinc-400 font-bold">
              Classement par performance sur la période
            </p>
          </div>
        </div>

        {/* Summary badges */}
        {summary && !loading && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-black text-foreground">
                {fmtCurrency(summary.totalRevenue)}
                <span className="text-[10px] font-bold text-zinc-400 ml-1">FCFA</span>
              </p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Total CA</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-foreground">{fmtNum(summary.totalTransactions)}</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Ventes</p>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              {COLS.map((col) => (
                <th
                  key={col.label}
                  className={`pb-3 text-[10px] font-black text-zinc-400 uppercase tracking-wider ${col.align ?? "text-left"} ${col.field ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                  onClick={() => col.field && handleSort(col.field)}
                >
                  <div className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : ""}`}>
                    {col.label}
                    {col.field && <SortIcon field={col.field} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {COLS.map((_, j) => (
                    <td key={j} className="py-3 pr-4">
                      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : cashiers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs font-bold text-zinc-400">
                  Aucune donnée pour cette période
                </td>
              </tr>
            ) : (
              cashiers.map((cashier, idx) => (
                <tr
                  key={cashier.userId}
                  className={`border-b border-zinc-50 dark:border-zinc-800/50 transition-colors ${
                    idx === 0
                      ? "bg-amber-50/50 dark:bg-amber-950/10"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  {/* Rang */}
                  <td className="py-3 pr-4 w-12">
                    {idx < 3 ? (
                      <Medal className={`h-4 w-4 ${RANK_COLORS[idx]}`} />
                    ) : (
                      <span className="text-xs font-black text-zinc-400 pl-0.5">#{idx + 1}</span>
                    )}
                  </td>

                  {/* Caissier */}
                  <td className="py-3 pr-4">
                    <p className="text-xs font-black text-foreground">{cashier.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">
                      {cashier.shopName || "—"} · {cashier.username}
                    </p>
                  </td>

                  {/* CA */}
                  <td className="py-3 pr-4 text-right">
                    <span className="text-xs font-black text-foreground">
                      {fmtCurrency(cashier.revenue)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold ml-1">FCFA</span>
                    {cashier.evolution !== 0 && (
                      <p className={`text-[10px] font-black ${cashier.evolution > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {cashier.evolution > 0 ? "+" : ""}{(cashier.evolution ?? 0).toFixed(0)}%
                      </p>
                    )}
                  </td>

                  {/* Transactions */}
                  <td className="py-3 pr-4 text-right">
                    <span className="text-xs font-black text-foreground">
                      {fmtNum(cashier.transactions)}
                    </span>
                    {cashier.averageBasket > 0 && (
                      <p className="text-[10px] text-zinc-400 font-bold">
                        moy. {fmtCurrency(cashier.averageBasket)}
                      </p>
                    )}
                  </td>

                  {/* Remises */}
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-xs font-bold ${cashier.totalDiscounts > 0 ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}`}>
                      {cashier.totalDiscounts > 0 ? `-${fmtCurrency(cashier.totalDiscounts)}` : "—"}
                    </span>
                  </td>

                  {/* Annulations */}
                  <td className="py-3 text-right">
                    <span className={`text-xs font-black ${cashier.voidedSales > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {cashier.voidedSales}
                    </span>
                    {cashier.voidRate > 0 && (
                      <p className="text-[10px] text-zinc-400 font-bold">
                        {cashier.voidRate.toFixed(1)}%
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
