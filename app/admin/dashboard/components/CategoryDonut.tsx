"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CategoriesPerformanceResponse } from "@/types/dashboard";
import { Tag } from "lucide-react";

interface CategoryDonutProps {
  data: CategoriesPerformanceResponse | null;
  loading: boolean;
}

const DEFAULT_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#f43f5e", "#3b82f6", "#a855f7", "#14b8a6",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: pl } = payload[0];
  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-black text-foreground">{name}</p>
      <p className="text-[11px] text-zinc-500 font-bold">
        {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA
      </p>
      <p className="text-[11px] text-zinc-400 font-bold">
        {pl.percentage?.toFixed(1)}% du total
      </p>
    </div>
  );
};

const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function CategoryDonut({ data, loading }: CategoryDonutProps) {
  const categories = data?.categories ?? [];

  const pieData = categories.map((cat, i) => ({
    name: cat.categoryName ?? "Sans catégorie",
    value: cat.revenue,
    percentage: cat.revenueShare,           // real field: revenueShare
    fill: cat.colorHex ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],  // real field: colorHex
  }));

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-cyan-500/10">
          <Tag className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">Ventes par Catégorie</h3>
          <p className="text-[10px] text-zinc-400 font-bold">Répartition du chiffre d'affaires</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      ) : pieData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
          <Tag className="h-10 w-10 opacity-20 mb-2" />
          <p className="text-xs font-bold">Aucune donnée</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-36">
            {pieData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.fill }}
                  />
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                    {cat.name}
                  </span>
                </div>
                <span className="text-[11px] font-black text-foreground">
                  {cat.percentage?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
