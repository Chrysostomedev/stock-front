"use client";

import React, { useState } from "react";
import { ShopsPerformanceResponse } from "@/types/dashboard";
import { Building2, Trophy, ArrowUpDown } from "lucide-react";

interface ShopsLeaderboardProps {
  data: ShopsPerformanceResponse | null;
  loading: boolean;
}

type SortKey = "revenue" | "transactions" | "grossMargin";

const RANK_COLORS = [
  "from-amber-400 to-amber-600",
  "from-zinc-400 to-zinc-500",
  "from-orange-400 to-orange-600",
];
const RANK_BG = [
  "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
  "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700",
  "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50",
];

export default function ShopsLeaderboard({ data, loading }: ShopsLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  const shops = data?.shops
    ? [...data.shops].sort((a, b) => b[sortKey] - a[sortKey])
    : [];

  const maxValue = shops[0]?.[sortKey] ?? 1;

  const formatVal = (val: number, key: SortKey) => {
    if (key === "transactions") return new Intl.NumberFormat("fr-FR").format(val);
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(val) + " FCFA";
  };

  const SORT_OPTS: { label: string; value: SortKey }[] = [
    { label: "CA", value: "revenue" },
    { label: "Transactions", value: "transactions" },
    { label: "Marge", value: "grossMargin" },
  ];

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Classement Boutiques</h3>
            <p className="text-[10px] text-zinc-400 font-bold">Performance comparative</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {SORT_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortKey(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                sortKey === opt.value
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))
        ) : shops.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <Building2 className="h-10 w-10 opacity-20 mb-2" />
            <p className="text-xs font-bold">Aucune boutique</p>
          </div>
        ) : (
          shops.map((shop, idx) => {
            const pct = (shop[sortKey] / maxValue) * 100;
            const rankBg = RANK_BG[idx] ?? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
            const rankGradient = RANK_COLORS[idx] ?? "from-violet-500 to-violet-600";

            return (
              <div
                key={shop.shopId}
                className={`relative p-3.5 rounded-xl border ${rankBg} overflow-hidden`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br ${rankGradient} flex items-center justify-center`}>
                    <span className="text-white text-xs font-black">#{idx + 1}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-foreground truncate pr-2">{shop.shopName}</span>
                      <span className="text-xs font-black text-foreground flex-shrink-0">
                        {formatVal(shop[sortKey], sortKey)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${rankGradient} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-zinc-400 font-bold">
                        Marge: {(shop.marginRate ?? 0).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {new Intl.NumberFormat("fr-FR").format(shop.transactions ?? 0)} ventes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
