"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { PeriodPreset, PeriodQuery } from "@/types/dashboard";
import { Shop } from "@/types/admin";

interface PeriodSelectorProps {
  query: PeriodQuery;
  onChange: (q: PeriodQuery) => void;
  shops: Shop[];
}
const PRESETS: { label: string; value: PeriodPreset }[] = [
  { label: "Aujourd'hui", value: "today" },
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "Ce mois", value: "month" },
];

export default function PeriodSelector({ query, onChange, shops }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            id={`period-${p.value}`}
            onClick={() => onChange({ ...query, preset: p.value, from: undefined, to: undefined })}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
              query.preset === p.value
                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* Shop filter */}
      {shops.length > 0 && (
        <div className="relative">
          <select
            id="dashboard-shop-filter"
            value={query.shopId ?? ""}
            onChange={(e) => onChange({ ...query, shopId: e.target.value || undefined })}
            className="appearance-none pl-3 pr-8 py-2 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black text-foreground outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Toutes les boutiques</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-zinc-400 pointer-events-none" />
        </div>
      )}
    </div>
  );
}
