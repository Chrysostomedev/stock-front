"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  TrendingUp,
  CalendarDays,
  ShoppingCart,
} from "lucide-react";
import axiosInstance from "@/core/axios";
import {
  SalesTimelineResponse,
  ShopsPerformanceResponse,
  FinancialReportResponse,
} from "@/types/dashboard";

type DayData = { revenue: number; transactions: number };
type DayMap = Record<string, DayData>; // "YYYY-MM-DD" → aggregated

interface DayDetail {
  date: string;
  shops: ShopsPerformanceResponse;
  financial: FinancialReportResponse;
}

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function toISO(d: Date) { return d.toISOString(); }
function startOf(d: Date) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function endOf(d: Date)   { const r = new Date(d); r.setHours(23, 59, 59, 999); return r; }

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toFixed(0);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

export default function SalesCalendar() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [dayMap, setDayMap] = useState<DayMap>({});
  const [maxRevenue, setMaxRevenue] = useState(1);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Fetch calendar heatmap data ──────────────────────────────────
  const fetchMonth = useCallback(async (firstDay: Date) => {
    setLoadingCalendar(true);
    setSelectedDay(null);
    setDayDetail(null);
    try {
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
      const resp: SalesTimelineResponse = await axiosInstance
        .get("/dashboard-super-admin/sales-timeline", {
          params: {
            period: "custom",
            startDate: toISO(startOf(firstDay)),
            endDate: toISO(endOf(lastDay)),
          },
        })
        .then((r) => r.data);

      // Aggregate all shops into one day-keyed map
      const map: DayMap = {};
      for (const shop of resp.byShop ?? []) {
        for (const point of shop.data ?? []) {
          const key = point.timeKey.slice(0, 10);
          if (!map[key]) map[key] = { revenue: 0, transactions: 0 };
          map[key].revenue += point.revenue;
          map[key].transactions += point.transactions;
        }
      }
      // Also merge global timeline if byShop is empty
      if (!resp.byShop?.length) {
        for (const point of resp.timeline ?? []) {
          const key = point.timeKey.slice(0, 10);
          if (!map[key]) map[key] = { revenue: 0, transactions: 0 };
          map[key].revenue += point.revenue;
          map[key].transactions += point.transactions;
        }
      }

      const max = Math.max(1, ...Object.values(map).map((d) => d.revenue));
      setDayMap(map);
      setMaxRevenue(max);
    } catch {
      setDayMap({});
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(viewDate);
  }, [viewDate, fetchMonth]);

  // ── Fetch day detail on click ────────────────────────────────────
  const handleDayClick = useCallback(
    async (dateStr: string) => {
      if (!dayMap[dateStr]?.revenue) return;
      setSelectedDay(dateStr);
      setLoadingDetail(true);
      setDayDetail(null);
      try {
        const d = new Date(dateStr + "T12:00:00");
        const params = {
          period: "custom",
          startDate: toISO(startOf(d)),
          endDate: toISO(endOf(d)),
        };
        const [shops, financial] = await Promise.all([
          axiosInstance.get("/dashboard-super-admin/shops", { params }).then((r) => r.data),
          axiosInstance.get("/dashboard-super-admin/financial-report", { params }).then((r) => r.data),
        ]);
        setDayDetail({ date: dateStr, shops, financial });
      } catch {
        // silently ignore — panel stays empty
      } finally {
        setLoadingDetail(false);
      }
    },
    [dayMap]
  );

  // ── Build calendar cells ─────────────────────────────────────────
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startOffset = firstDayOfMonth.getDay() - 1; // Mon-based
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getHeatColor = (dateStr: string) => {
    const d = dayMap[dateStr];
    if (!d || d.revenue === 0) return "bg-zinc-100 dark:bg-zinc-800/60";
    const r = d.revenue / maxRevenue;
    if (r < 0.15) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200";
    if (r < 0.35) return "bg-emerald-200 dark:bg-emerald-800/45 text-emerald-800 dark:text-emerald-200";
    if (r < 0.55) return "bg-emerald-300 dark:bg-emerald-700/55 text-emerald-900 dark:text-white";
    if (r < 0.75) return "bg-emerald-400 dark:bg-emerald-600/65 text-emerald-900 dark:text-white";
    return "bg-emerald-500 dark:bg-emerald-500/75 text-white";
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday   = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const closePanel = () => { setSelectedDay(null); setDayDetail(null); };

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <CalendarDays className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs font-black text-foreground">Agenda des ventes</p>
            <p className="text-[10px] text-zinc-400 font-bold">
              Cliquez sur un jour pour le détail
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="px-2.5 py-1.5 text-[10px] font-black rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
          >
            Aujourd'hui
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Month label ─────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-sm font-black text-foreground">
          {MONTHS_FR[month]} <span className="text-zinc-400 font-bold">{year}</span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row">

        {/* ── Calendar grid ──────────────────────────────────────────── */}
        <div className={`p-4 transition-all ${selectedDay ? "lg:w-[55%]" : "w-full"}`}>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-[9px] font-black text-zinc-400 py-1 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {loadingCalendar ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="aspect-square" />;

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasData  = !!dayMap[dateStr]?.revenue;
                const isToday  = dateStr === todayStr;
                const isSel    = dateStr === selectedDay;
                const heatCls  = getHeatColor(dateStr);

                return (
                  <button
                    key={`d-${day}`}
                    onClick={() => handleDayClick(dateStr)}
                    disabled={!hasData}
                    title={hasData ? `${day} — ${fmt(dayMap[dateStr].revenue)} FCFA` : undefined}
                    className={[
                      "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all",
                      hasData ? "cursor-pointer hover:scale-110 hover:shadow-md hover:z-10" : "cursor-default opacity-60",
                      isSel  ? "ring-2 ring-violet-500 ring-offset-1 scale-110 z-10 shadow-lg" : "",
                      isToday && !isSel ? "ring-2 ring-zinc-400 dark:ring-zinc-500" : "",
                      heatCls,
                    ].join(" ")}
                  >
                    <span className={`text-[11px] font-black leading-none ${hasData ? "" : "text-zinc-400"}`}>
                      {day}
                    </span>
                    {hasData && (
                      <span className="text-[7px] font-bold leading-none opacity-80">
                        {fmtShort(dayMap[dateStr].revenue)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          {!loadingCalendar && (
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">CA</span>
              <div className="flex items-center gap-0.5">
                <div className="h-2.5 w-4 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2.5 w-4 rounded-sm bg-emerald-100 dark:bg-emerald-900/30" />
                <div className="h-2.5 w-4 rounded-sm bg-emerald-200 dark:bg-emerald-800/45" />
                <div className="h-2.5 w-4 rounded-sm bg-emerald-300 dark:bg-emerald-700/55" />
                <div className="h-2.5 w-4 rounded-sm bg-emerald-400 dark:bg-emerald-600/65" />
                <div className="h-2.5 w-4 rounded-sm bg-emerald-500" />
              </div>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                {dayMap && Object.keys(dayMap).length > 0
                  ? `Max: ${fmtShort(maxRevenue)} FCFA`
                  : "Aucune donnée"}
              </span>
            </div>
          )}
        </div>

        {/* ── Day detail panel ──────────────────────────────────────── */}
        {selectedDay && (
          <div className="lg:w-[45%] border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800 flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-black text-foreground capitalize">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[480px]">
              {/* Day summary chips */}
              {dayMap[selectedDay] && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center">
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {fmtShort(dayMap[selectedDay].revenue)}
                    </p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">CA FCFA</p>
                  </div>
                  <div className="flex-1 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center">
                    <p className="text-base font-black text-blue-700 dark:text-blue-400">
                      {dayMap[selectedDay].transactions}
                    </p>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Transactions</p>
                  </div>
                </div>
              )}

              {loadingDetail ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-5 w-5 rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : dayDetail ? (
                <>
                  {/* Shops table */}
                  {dayDetail.shops.shops?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          Boutiques ({dayDetail.shops.shops.length})
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                              <th className="text-left px-2 py-1.5 font-black text-zinc-500">Boutique</th>
                              <th className="text-right px-2 py-1.5 font-black text-zinc-500">CA</th>
                              <th className="text-right px-2 py-1.5 font-black text-zinc-500 hidden sm:table-cell">Marge</th>
                              <th className="text-right px-2 py-1.5 font-black text-zinc-500">Tx</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayDetail.shops.shops.map((shop, i) => (
                              <tr
                                key={shop.shopId}
                                className={i % 2 === 0 ? "" : "bg-zinc-50/50 dark:bg-zinc-800/20"}
                              >
                                <td className="px-2 py-1.5 font-bold text-foreground max-w-[90px] truncate">
                                  {shop.shopName}
                                </td>
                                <td className="px-2 py-1.5 text-right font-black text-foreground">
                                  {fmt(shop.revenue ?? 0)}
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold text-emerald-600 hidden sm:table-cell">
                                  {fmt(shop.grossMargin ?? 0)}
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold text-zinc-500">
                                  {shop.transactions ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mini P&L */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Résultat du jour
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: "CA net",
                          value: dayDetail.financial.pnl?.revenue?.net ?? 0,
                          color: "text-foreground",
                        },
                        {
                          label: "Marge brute",
                          value: dayDetail.financial.pnl?.grossMargin?.value ?? 0,
                          color: "text-emerald-600 dark:text-emerald-400",
                        },
                        {
                          label: "Dépenses",
                          value: dayDetail.financial.pnl?.expenses?.total ?? 0,
                          color: "text-rose-500",
                        },
                        {
                          label: "Résultat net",
                          value: dayDetail.financial.pnl?.netResult?.value ?? 0,
                          color: (dayDetail.financial.pnl?.netResult?.isProfit ?? true)
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500",
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5"
                        >
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                            {label}
                          </p>
                          <p className={`text-sm font-black ${color} leading-tight`}>
                            {fmt(value)}
                            <span className="text-[8px] font-bold text-zinc-400 ml-0.5">FCFA</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panier moyen */}
                  {dayDetail.shops.shops?.length > 0 && (() => {
                    const totalTx = dayDetail.shops.shops.reduce((s, sh) => s + (sh.transactions ?? 0), 0);
                    const totalRev = dayDetail.shops.shops.reduce((s, sh) => s + (sh.revenue ?? 0), 0);
                    return totalTx > 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                        <ShoppingCart className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Panier moyen</p>
                          <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                            {fmt(Math.round(totalRev / totalTx))}{" "}
                            <span className="text-[9px] font-bold text-amber-400">FCFA</span>
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-4">
                  Impossible de charger les détails de ce jour.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
