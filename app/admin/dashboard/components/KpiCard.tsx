"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  id: string;
  title: string;
  value: number | string;
  previous?: number;
  change?: number;
  icon: React.ReactNode;
  format?: "currency" | "number" | "percent" | "string";
  currency?: string;
  color: "violet" | "emerald" | "blue" | "amber" | "rose";
  loading?: boolean;
  subtitle?: string;
}

const colorMap = {
  violet: {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    icon: "text-violet-500",
    gradient: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: "text-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: "text-amber-500",
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    icon: "text-rose-500",
    gradient: "from-rose-500/20 to-rose-500/5",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/10",
  },
};

function formatValue(value: number | string, fmt: string, currency = "FCFA") {
  if (typeof value === "string") return value;
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(value) + ` ${currency}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return new Intl.NumberFormat("fr-FR").format(value);
    default:
      return String(value);
  }
}

export default function KpiCard({
  id,
  title,
  value,
  change,
  icon,
  format = "number",
  currency = "FCFA",
  color,
  loading = false,
  subtitle,
}: KpiCardProps) {
  const c = colorMap[color];
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl border ${c.border} bg-card p-5 shadow-lg ${c.glow} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${c.bg}`}>
            <span className={c.icon}>{icon}</span>
          </div>
          {!isNeutral && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                isPositive
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change!).toFixed(1)}%
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse w-3/4" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-black text-foreground tracking-tight leading-none mb-1">
              {formatValue(value, format, currency)}
            </p>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{title}</p>
            {subtitle && (
              <p className="text-[10px] text-zinc-400 font-medium mt-1">{subtitle}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
