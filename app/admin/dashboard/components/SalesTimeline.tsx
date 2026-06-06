"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SalesTimelineResponse } from "@/types/dashboard";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface SalesTimelineProps {
  data: SalesTimelineResponse | null;
  loading: boolean;
}

const SHOP_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#3b82f6", // blue
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-xl">
      <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] font-bold text-foreground">
            {entry.name}:{" "}
            {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(entry.value)}{" "}
            FCFA
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SalesTimeline({ data, loading }: SalesTimelineProps) {
  const { chartData, shopNames, totalRevenue } = useMemo(() => {
    // Utilise byShop[] qui contient shopName + data[]{timeKey, revenue}
    const byShop = data?.byShop;
    if (!byShop?.length) return { chartData: [], shopNames: [], totalRevenue: 0 };

    // Collecte toutes les dates uniques
    const dateSet = new Set<string>();
    byShop.forEach((shop) =>
      shop.data?.forEach((pt) => dateSet.add(pt.timeKey))
    );

    // Trie les dates
    const sortedDates = [...dateSet].sort();

    // Construit les lignes du chart: { date: "xx MMM", "Boutique A": 3000, "Boutique B": 0 }
    const chartData = sortedDates.map((key) => {
      let dateLabel: string;
      try {
        dateLabel = format(parseISO(key), "dd MMM", { locale: fr });
      } catch {
        dateLabel = key;
      }

      const row: Record<string, string | number> = { date: dateLabel };
      byShop.forEach((shop) => {
        const pt = shop.data?.find((d) => d.timeKey === key);
        row[shop.shopName] = pt?.revenue ?? 0;
      });
      return row;
    });

    const shopNames = byShop.map((s) => s.shopName);
    const totalRevenue = data?.stats?.totalRevenue ?? 0;

    return { chartData, shopNames, totalRevenue };
  }, [data]);

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Évolution des Ventes</h3>
            <p className="text-[10px] text-zinc-400 font-bold">
              Chiffre d'affaires par boutique sur la période
            </p>
          </div>
        </div>

        {/* Total stat */}
        {!loading && totalRevenue > 0 && (
          <div className="text-right hidden sm:block">
            <p className="text-lg font-black text-foreground">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(totalRevenue)}
              <span className="text-xs font-bold text-zinc-400 ml-1">FCFA</span>
            </p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase">Total période</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
          <TrendingUp className="h-10 w-10 opacity-20 mb-2" />
          <p className="text-xs font-bold">Aucune donnée pour cette période</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            barCategoryGap="25%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.15)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(161,161,170,0.8)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(161,161,170,0.8)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}k`
                  : String(v)
              }
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(161,161,170,0.07)", radius: 6 }} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            {shopNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                fill={SHOP_COLORS[i % SHOP_COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
