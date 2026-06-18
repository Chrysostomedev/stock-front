"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, X,
  Building2, TrendingUp, ShoppingCart, CalendarDays, Zap,
} from "lucide-react";
import axiosInstance from "@/core/axios";
import {
  SalesTimelineResponse,
  ShopsPerformanceResponse,
  FinancialReportResponse,
} from "@/types/dashboard";

type DayData = { revenue: number; transactions: number };
type DayMap = Record<string, DayData>;

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

/* ── Heatmap bleu ─────────────────────────────────────────────────────── */
function getHeatStyle(dateStr: string, dayMap: DayMap, maxRevenue: number, isSelected: boolean) {
  const d = dayMap[dateStr];
  if (!d || d.revenue === 0) return { cls: "bg-slate-100 dark:bg-slate-800/50 text-slate-400", dot: false };
  if (isSelected) return { cls: "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105", dot: true };
  const r = d.revenue / maxRevenue;
  if (r < 0.15) return { cls: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300", dot: true };
  if (r < 0.30) return { cls: "bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200", dot: true };
  if (r < 0.50) return { cls: "bg-blue-300 dark:bg-blue-800/70 text-blue-900 dark:text-white", dot: true };
  if (r < 0.70) return { cls: "bg-blue-400 dark:bg-blue-700/80 text-white", dot: true };
  if (r < 0.85) return { cls: "bg-blue-500 dark:bg-blue-600/90 text-white", dot: true };
  return { cls: "bg-blue-600 text-white", dot: true };
}

/* ══ COMPOSANT ════════════════════════════════════════════════════════════ */
export default function SalesCalendar() {
  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [dayMap, setDayMap]         = useState<DayMap>({});
  const [maxRevenue, setMaxRevenue] = useState(1);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedDay, setSelectedDay]   = useState<string | null>(null);
  const [dayDetail, setDayDetail]       = useState<DayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ── Fetch heatmap ─────────────────────────────────────────────────── */
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
            endDate:   toISO(endOf(lastDay)),
          },
        })
        .then((r) => r.data);

      const map: DayMap = {};
      for (const shop of resp.byShop ?? []) {
        for (const point of shop.data ?? []) {
          const key = point.timeKey.slice(0, 10);
          if (!map[key]) map[key] = { revenue: 0, transactions: 0 };
          map[key].revenue += point.revenue;
          map[key].transactions += point.transactions;
        }
      }
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

  useEffect(() => { fetchMonth(viewDate); }, [viewDate, fetchMonth]);

  /* ── Fetch day detail ──────────────────────────────────────────────── */
  const handleDayClick = useCallback(
    async (dateStr: string) => {
      if (!dayMap[dateStr]?.revenue) return;
      if (selectedDay === dateStr) { setSelectedDay(null); setDayDetail(null); return; }
      setSelectedDay(dateStr);
      setLoadingDetail(true);
      setDayDetail(null);
      try {
        const d = new Date(dateStr + "T12:00:00");
        const params = {
          period: "custom",
          startDate: toISO(startOf(d)),
          endDate:   toISO(endOf(d)),
        };
        const [shops, financial] = await Promise.all([
          axiosInstance.get("/dashboard-super-admin/shops", { params }).then((r) => r.data),
          axiosInstance.get("/dashboard-super-admin/financial-report", { params }).then((r) => r.data),
        ]);
        setDayDetail({ date: dateStr, shops, financial });
      } catch {
        /* silently ignore */
      } finally {
        setLoadingDetail(false);
      }
    },
    [dayMap, selectedDay]
  );

  /* ── Calendar cells ────────────────────────────────────────────────── */
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  /* ── Stats du mois ─────────────────────────────────────────────────── */
  const monthRevenue = Object.values(dayMap).reduce((s, d) => s + d.revenue, 0);
  const activeDays   = Object.values(dayMap).filter((d) => d.revenue > 0).length;
  const monthTx      = Object.values(dayMap).reduce((s, d) => s + d.transactions, 0);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday   = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  /* ════════════════════════════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-500/8 border border-blue-100 dark:border-blue-900/30 bg-white dark:bg-zinc-900">

      {/* ── HEADER GRADIENT ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight">Agenda des ventes</p>
              <p className="text-blue-100 text-[10px] font-bold">
                Cliquez sur un jour pour le détail boutique
              </p>
            </div>
          </div>
          {/* Navigation mois */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-black transition-all"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Mini stats du mois ── */}
        {!loadingCalendar && monthRevenue > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/20">
            <div className="flex-1 text-center">
              <p className="text-white font-black text-base leading-none">{fmtShort(monthRevenue)}</p>
              <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-0.5">CA du mois</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex-1 text-center">
              <p className="text-white font-black text-base leading-none">{activeDays}</p>
              <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-0.5">Jours actifs</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex-1 text-center">
              <p className="text-white font-black text-base leading-none">{monthTx}</p>
              <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-0.5">Transactions</p>
            </div>
            {activeDays > 0 && (
              <>
                <div className="w-px h-8 bg-white/20" />
                <div className="flex-1 text-center">
                  <p className="text-white font-black text-base leading-none">{fmtShort(Math.round(monthRevenue / activeDays))}</p>
                  <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-0.5">Moy/jour</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── MOIS + GRILLE + PANEL ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row">

        {/* ── Calendrier ── */}
        <div className={`transition-all duration-300 ${selectedDay ? "lg:w-[56%]" : "w-full"}`}>
          {/* Nom du mois */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="text-base font-black text-foreground">
              {MONTHS_FR[month]}{" "}
              <span className="text-blue-500 dark:text-blue-400">{year}</span>
            </p>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 px-4">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-[9px] font-black text-slate-400 dark:text-slate-500 py-2 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="px-4 pb-4">
            {loadingCalendar ? (
              <div className="flex flex-col items-center justify-center h-44 gap-3">
                <div className="animate-spin h-7 w-7 rounded-full border-[3px] border-blue-500 border-t-transparent" />
                <p className="text-[11px] font-bold text-blue-400">Chargement…</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} className="aspect-square" />;

                  const dateStr   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasData   = !!dayMap[dateStr]?.revenue;
                  const isToday   = dateStr === todayStr;
                  const isSel     = dateStr === selectedDay;
                  const { cls }   = getHeatStyle(dateStr, dayMap, maxRevenue, isSel);

                  return (
                    <button
                      key={`d-${day}`}
                      onClick={() => handleDayClick(dateStr)}
                      disabled={!hasData}
                      title={hasData ? `${day} — ${fmt(dayMap[dateStr].revenue)} FCFA · ${dayMap[dateStr].transactions} ventes` : undefined}
                      className={[
                        "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                        hasData ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default",
                        isToday && !isSel ? "ring-2 ring-blue-500 ring-offset-1" : "",
                        cls,
                      ].join(" ")}
                    >
                      <span className={`text-[11px] font-black leading-none`}>{day}</span>
                      {hasData && (
                        <span className="text-[7px] font-bold leading-none opacity-90">
                          {fmtShort(dayMap[dateStr].revenue)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Légende */}
            {!loadingCalendar && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Faible</span>
                <div className="flex gap-0.5">
                  {[
                    "bg-slate-100 dark:bg-slate-800",
                    "bg-blue-100 dark:bg-blue-950/50",
                    "bg-blue-200 dark:bg-blue-900/60",
                    "bg-blue-300 dark:bg-blue-800/70",
                    "bg-blue-400 dark:bg-blue-700/80",
                    "bg-blue-500",
                    "bg-blue-600",
                  ].map((c, i) => (
                    <div key={i} className={`h-2.5 w-5 rounded-sm ${c}`} />
                  ))}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Élevé</span>
                {maxRevenue > 1 && (
                  <span className="ml-auto text-[9px] font-black text-blue-500">
                    Max : {fmtShort(maxRevenue)} FCFA
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel détail ── */}
        {selectedDay && (
          <div className="lg:w-[44%] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-zinc-800/30">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-xs font-black text-foreground capitalize">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
              </div>
              <button
                onClick={() => { setSelectedDay(null); setDayDetail(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-4 overflow-y-auto max-h-[500px]">

              {/* Chips CA + Tx */}
              {dayMap[selectedDay] && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-600 rounded-2xl p-3.5 text-center shadow-lg shadow-blue-500/20">
                    <p className="text-white font-black text-lg leading-none">
                      {fmtShort(dayMap[selectedDay].revenue)}
                    </p>
                    <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-1">
                      CA FCFA
                    </p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3.5 text-center">
                    <p className="text-indigo-700 dark:text-indigo-300 font-black text-lg leading-none">
                      {dayMap[selectedDay].transactions}
                    </p>
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">
                      Transactions
                    </p>
                  </div>
                </div>
              )}

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p className="text-[10px] font-bold text-blue-400">Chargement du détail…</p>
                </div>
              ) : dayDetail ? (
                <>
                  {/* Boutiques */}
                  {dayDetail.shops.shops?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Boutiques ({dayDetail.shops.shops.length})
                        </p>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-blue-50 dark:bg-blue-950/30">
                              <th className="text-left px-3 py-2 font-black text-blue-600 dark:text-blue-400">Boutique</th>
                              <th className="text-right px-3 py-2 font-black text-blue-600 dark:text-blue-400">CA</th>
                              <th className="text-right px-3 py-2 font-black text-blue-600 dark:text-blue-400">Marge</th>
                              <th className="text-right px-3 py-2 font-black text-blue-600 dark:text-blue-400">Tx</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayDetail.shops.shops.map((shop, i) => {
                              const hasAbsMargin = (shop.grossMargin ?? 0) > 0;
                              const rate = shop.marginRate ?? 0;
                              return (
                                <tr key={shop.shopId}
                                  className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}`}
                                >
                                  <td className="px-3 py-2 font-bold text-foreground max-w-[80px] truncate">
                                    {shop.shopName}
                                  </td>
                                  <td className="px-3 py-2 text-right font-black text-foreground">
                                    {fmt(shop.revenue ?? 0)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {hasAbsMargin ? (
                                      <span className="font-bold text-emerald-600">{fmt(shop.grossMargin)}</span>
                                    ) : (
                                      <span className={`font-bold ${rate > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                        {rate.toFixed(1)}%
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-slate-500">
                                    {shop.transactions ?? 0}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* P&L du jour */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Résultat financier
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "CA net", value: dayDetail.financial.pnl?.revenue?.net ?? 0, accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30" },
                        { label: "Marge brute", value: dayDetail.financial.pnl?.grossMargin?.value ?? 0, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30" },
                        { label: "Dépenses", value: dayDetail.financial.pnl?.expenses?.total ?? 0, accent: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30" },
                        {
                          label: "Résultat net",
                          value: dayDetail.financial.pnl?.netResult?.value ?? 0,
                          accent: (dayDetail.financial.pnl?.netResult?.isProfit ?? true) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500",
                          bg: (dayDetail.financial.pnl?.netResult?.isProfit ?? true) ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30",
                        },
                      ].map(({ label, value, accent, bg }) => (
                        <div key={label} className={`rounded-xl px-3 py-2.5 ${bg}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                          <p className={`text-sm font-black ${accent} leading-tight`}>
                            {fmt(value)}
                            <span className="text-[8px] font-bold text-slate-400 ml-0.5">FCFA</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panier moyen */}
                  {(() => {
                    const shops = dayDetail.shops.shops ?? [];
                    const totalTx  = shops.reduce((s, sh) => s + (sh.transactions ?? 0), 0);
                    const totalRev = shops.reduce((s, sh) => s + (sh.revenue ?? 0), 0);
                    if (!totalTx) return null;
                    return (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                        <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-lg flex-shrink-0">
                          <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Panier moyen</p>
                          <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                            {fmt(Math.round(totalRev / totalTx))}
                            <span className="text-[9px] font-bold text-amber-400 ml-1">FCFA</span>
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[9px] font-black text-amber-500">
                          <Zap className="h-3 w-3" />
                          {totalTx} ventes
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                  <CalendarDays className="h-8 w-8 opacity-30" />
                  <p className="text-xs font-bold">Impossible de charger ce jour</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
