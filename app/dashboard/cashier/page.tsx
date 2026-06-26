"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import CashierDashboardService, {
  CashierOverview,
} from "@/services/super/cashierDashboard.service";
import {
  User, Calendar, ShoppingBag, TrendingUp,
  Percent, RefreshCw, Banknote,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const paymentLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
  CREDIT: "Crédit client",
};

function CashierDashboardContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<CashierOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const load = async (d = date) => {
    if (!shopId || !userId) return;
    setLoading(true);
    try {
      setData(await CashierDashboardService.getOverview({ userId, shopId, date: d }));
    } catch {
      showToast("Impossible de charger les données du caissier", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(date); }, [shopId, userId, date]);

  const maxTimeline = Math.max(1, ...(data?.timeline.map((t) => t.revenue) ?? [1]));
  const maxPayment = Math.max(1, ...(data?.payments.map((p) => p.amount) ?? [1]));

  return (
    <AppLayout
      title={loading ? "Caissier" : data?.cashier.name ?? "Caissier"}
      subtitle={loading ? "Chargement…" : data?.cashier.username ?? ""}
      backUrl="/dashboard"
      rightElement={
        <button onClick={() => load(date)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {!userId && (
          <div className="py-12 text-center text-zinc-400 text-sm font-bold">
            Aucun caissier sélectionné.
          </div>
        )}

        {/* ── Sélecteur date ── */}
        {userId && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 shadow-sm">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── Profil caissier ── */}
        {!loading && data && (
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">{data.cashier.name}</p>
              <p className="text-xs font-bold text-zinc-400">@{data.cashier.username} · {data.cashier.role}</p>
              {data.session && (
                <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                  Session {data.session.isOpen ? "ouverte" : "fermée"} · Ouverture: {fmt(data.session.openingBalance)} XOF
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── KPIs ── */}
        {userId && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "CA du Jour", value: loading ? "—" : `${fmt(data?.kpis.revenue ?? 0)} XOF`, icon: <TrendingUp className="h-4 w-4" />, color: "bg-primary/10 text-primary" },
              { label: "Transactions", value: loading ? "—" : String(data?.kpis.completedTransactions ?? 0), icon: <ShoppingBag className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600" },
              { label: "Panier Moyen", value: loading ? "—" : `${fmt(data?.kpis.averageBasket ?? 0)} XOF`, icon: <Banknote className="h-4 w-4" />, color: "bg-amber-500/10 text-amber-600" },
              { label: "Taux Annulation", value: loading ? "—" : `${data?.kpis.voidRate ?? 0}%`, icon: <Percent className="h-4 w-4" />, color: "bg-red-500/10 text-red-500" },
              { label: "Remises Totales", value: loading ? "—" : `${fmt(data?.kpis.totalDiscounts ?? 0)} XOF`, icon: <Banknote className="h-4 w-4" />, color: "bg-violet-500/10 text-violet-600" },
              { label: "Monnaie Rendue", value: loading ? "—" : `${fmt(data?.kpis.totalChange ?? 0)} XOF`, icon: <Banknote className="h-4 w-4" />, color: "bg-zinc-500/10 text-zinc-600" },
            ].map((kpi) => (
              <div key={kpi.label} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{kpi.label}</span>
                  <div className={`p-1.5 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
                </div>
                <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">{kpi.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline horaire ── */}
        {userId && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Activité par Heure</h3>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="h-24 flex items-center justify-center text-zinc-400 text-xs font-bold">Chargement…</div>
              ) : (data?.timeline ?? []).length === 0 ? (
                <div className="h-24 flex items-center justify-center text-zinc-400 text-xs font-bold">Aucune activité</div>
              ) : (
                <>
                  <div className="flex items-end gap-1" style={{ height: 80 }}>
                    {data!.timeline.map((t) => {
                      const h = Math.max(3, Math.round((t.revenue / maxTimeline) * 75));
                      return (
                        <div key={t.hour} className="flex flex-col items-center flex-1 justify-end h-full">
                          <div
                            className="w-full bg-primary rounded-t-md hover:bg-primary/80 transition-colors cursor-default"
                            style={{ height: h }}
                            title={`${t.hour}h — ${fmt(t.revenue)} XOF (${t.transactionCount} ventes)`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {data!.timeline.map((t) => (
                      <span key={t.hour} className="flex-1 text-[8px] font-bold text-zinc-400 text-center">{t.hour}h</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Paiements ── */}
        {userId && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Modes de Paiement
              </h3>
            </div>
            {loading ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.payments ?? []).length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Aucune vente</div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-4">
                {data!.payments.map((p) => {
                  const pct = Math.round((p.amount / maxPayment) * 100);
                  return (
                    <div key={p.method}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-700 dark:text-zinc-300">{paymentLabel[p.method] ?? p.method}</span>
                          <span className="text-[10px] text-zinc-400">({p.count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800 dark:text-zinc-200">{fmt(p.amount)} XOF</span>
                          <span className="text-[10px] font-black text-zinc-400">{p.share}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Dernières ventes ── */}
        {userId && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Dernières Ventes</h3>
            </div>
            {loading ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.recentSales ?? []).length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-bold">Aucune vente</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-black">Reçu</th>
                      <th className="px-3 py-3 text-center font-black">Articles</th>
                      <th className="px-3 py-3 text-center font-black">Paiement</th>
                      <th className="px-3 py-3 text-right font-black">Montant</th>
                      <th className="px-3 py-3 text-right font-black">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data!.recentSales.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-black text-zinc-800 dark:text-zinc-100">{s.receiptNumber}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-zinc-500">{s.itemCount}</td>
                        <td className="px-3 py-2.5 text-center text-zinc-500 font-bold">{paymentLabel[s.paymentMethod] ?? s.paymentMethod}</td>
                        <td className="px-3 py-2.5 text-right font-black text-primary">{fmt(s.totalAmount)} XOF</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${s.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "bg-red-50 dark:bg-red-950/20 text-red-500"}`}>
                            {s.status === "COMPLETED" ? "Complétée" : s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}

export default function CashierDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-400 text-sm font-bold">Chargement…</div>}>
      <CashierDashboardContent />
    </Suspense>
  );
}
