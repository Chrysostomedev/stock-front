"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import SaleService from "@/services/sale.service";
import { useAuth } from "@/hooks/useAuth";
import CashierDashboardService, {
  CashierOverview,
} from "@/services/super/cashierDashboard.service";
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Wallet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  Receipt,
  Activity,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  CASH:         <Banknote className="h-3.5 w-3.5" />,
  MOBILE_MONEY: <Smartphone className="h-3.5 w-3.5" />,
  BANK_CARD:    <CreditCard className="h-3.5 w-3.5" />,
};

const PAYMENT_COLORS: Record<string, string> = {
  CASH:         "bg-emerald-500",
  MOBILE_MONEY: "bg-primary",
  BANK_CARD:    "bg-amber-500",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH:         "Espèces",
  MOBILE_MONEY: "Mobile Money",
  BANK_CARD:    "Carte Bancaire",
  MIXED:        "Mixte",
};

const modules = [
  {
    title: "Caisse",
    fullTitle: "Caisse Supérette",
    description: "Interface de vente rapide avec calcul de monnaie automatique.",
    icon: <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />,
    href: "/super/caisse",
    color: "border-l-primary",
    bgLight: "bg-primary/10",
  },
  {
    title: "Stocks",
    fullTitle: "Gestion des Stocks",
    description: "Suivi des arrivages, prix et quantités en rayon.",
    icon: <Package className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />,
    href: "/super/produits",
    color: "border-l-emerald-500",
    bgLight: "bg-emerald-500/10",
  },
  {
    title: "Ventes",
    fullTitle: "Historique des Ventes",
    description: "Consultez tous les tickets de caisse émis.",
    icon: <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-600" />,
    href: "/super/commandes",
    color: "border-l-zinc-500",
    bgLight: "bg-zinc-500/10",
  },
  {
    title: "Périmés",
    fullTitle: "Pertes & Périmés",
    description: "Suivi des produits proches de la date limite.",
    icon: <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />,
    href: "/super/perimes",
    color: "border-l-red-500",
    bgLight: "bg-red-500/10",
  },
  {
    title: "Fidélité",
    fullTitle: "Fidélité Clients",
    description: "Gestion des points et remises clients réguliers.",
    icon: <Users className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />,
    href: "/super/fidelite",
    color: "border-l-amber-500",
    bgLight: "bg-amber-500/10",
  },
  {
    title: "Dépenses",
    fullTitle: "Dépenses Boutique",
    description: "Petites charges opérationnelles quotidiennes.",
    icon: <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />,
    href: "/super/depenses",
    color: "border-l-orange-500",
    bgLight: "bg-orange-500/10",
  },
];

const PAYMENT_METHODS = [
  { value: "CASH",         label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "BANK_CARD",    label: "Carte bancaire" },
  { value: "CREDIT",       label: "Crédit client" },
];

export default function SuperDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [overview, setOverview] = useState<CashierOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── State void ── */
  const [isVoidOpen, setIsVoidOpen]             = useState(false);
  const [voidSale, setVoidSale]                 = useState<any>(null);
  const [voidReason, setVoidReason]             = useState("");
  const [isVoidSubmitting, setIsVoidSubmitting] = useState(false);

  /* ── State refund ── */
  const [isRefundOpen, setIsRefundOpen]                 = useState(false);
  const [refundSale, setRefundSale]                     = useState<any>(null);
  const [refundPaymentMethod, setRefundPaymentMethod]   = useState<"CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT">("CASH");
  const [returnToStock, setReturnToStock]               = useState(true);
  const [refundReason, setRefundReason]                 = useState("");
  const [isRefundSubmitting, setIsRefundSubmitting]     = useState(false);

  const openVoid = (sale: any) => { setVoidSale(sale); setVoidReason(""); setIsVoidOpen(true); };
  const openRefund = (sale: any) => {
    setRefundSale(sale);
    setRefundReason("");
    setRefundPaymentMethod("CASH");
    setReturnToStock(true);
    setIsRefundOpen(true);
  };

  const handleVoid = async () => {
    if (!voidSale || voidReason.trim().length < 5) return;
    setIsVoidSubmitting(true);
    try {
      await SaleService.void(voidSale.id, { userId: user!.id, reason: voidReason.trim() });
      showToast(`Vente ${voidSale.receiptNumber} annulée — stock restitué`, "success");
      setIsVoidOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Erreur lors de l'annulation", "error");
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!refundSale || refundReason.trim().length < 5) return;
    setIsRefundSubmitting(true);
    try {
      await SaleService.refund(refundSale.id, {
        userId: user!.id,
        paymentMethod: refundPaymentMethod,
        returnToStock,
        reason: refundReason.trim(),
      });
      showToast(`Remboursement de ${fmt(refundSale.totalAmount)} XOF effectué`, "success");
      setIsRefundOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Erreur lors du remboursement", "error");
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  const userId = user?.id;
  const shopId = user?.shopId;
  useEffect(() => {
    if (!userId || !shopId) return;
    let cancelled = false;
    CashierDashboardService.getOverview({ userId, shopId })
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError("Impossible de charger le dashboard.");
          setLoading(false);
          console.error("[Dashboard]", err);
        }
      });
    return () => { cancelled = true; };
  }, [userId, shopId, refreshKey]);

  const kpis = overview?.kpis;
  const session = overview?.session;
  const maxTimeline = Math.max(1, ...(overview?.timeline.map((t) => t.revenue) ?? [1]));

  return (
    <AppLayout
      title="Mon Dashboard journalier"
      subtitle={
        overview
          ? `${overview.cashier.name} · ${new Date(overview.period.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`
          : "Chargement…"
      }
      rightElement={
        <button
          onClick={() => { setLoading(true); setError(null); setRefreshKey((k) => k + 1); }}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">

        {/* ── Bannière session ── */}
        {!loading && session && (
          <div className={`flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
            session.isOpen
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500"
          }`}>
            <div className="flex items-center gap-2.5">
              {session.isOpen
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />}
              <span>
                Session {session.isOpen ? "ouverte" : "fermée"} · Fond :{" "}
                <span className="font-black">{fmt(session.openingBalance)} XOF</span>
              </span>
            </div>
            {session.isOpen && (
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {new Date(session.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* CA */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">CA du Jour</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {loading ? "—" : fmt(kpis?.revenue ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 ml-1">XOF</span>
            </div>
          </div>

          {/* Transactions */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Transactions</span>
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {loading ? "—" : (kpis?.totalTransactions ?? 0)}
              </span>
              {!loading && (kpis?.voidedTransactions ?? 0) > 0 && (
                <span className="text-[10px] text-red-500 font-bold ml-2">
                  {kpis!.voidedTransactions} annulée{kpis!.voidedTransactions > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Panier moyen */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Panier Moyen</span>
              <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {loading ? "—" : fmt(kpis?.averageBasket ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 ml-1">XOF</span>
            </div>
          </div>

          {/* Remises */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Remises</span>
              <div className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg">
                <XCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {loading ? "—" : fmt(kpis?.totalDiscounts ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 ml-1">XOF</span>
            </div>
          </div>
        </div>
        {/* ── Paiements + Timeline ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Répartition paiements */}
          <Card className="p-5">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Modes de Paiement
            </h3>
            {loading ? (
              <div className="h-24 flex items-center justify-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (overview?.payments ?? []).length === 0 ? (
              <div className="h-24 flex items-center justify-center text-zinc-400 text-xs font-bold">Aucune vente aujourd'hui</div>
            ) : (
              <div className="flex flex-col gap-3">
                {(overview?.payments ?? []).map((p) => (
                  <div key={p.method} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-400">
                          {PAYMENT_ICONS[p.method] ?? <CreditCard className="h-3.5 w-3.5" />}
                        </span>
                        {PAYMENT_LABELS[p.method] ?? p.method}
                        <span className="text-[10px] text-zinc-400 font-medium">({p.count} vente{p.count > 1 ? "s" : ""})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-zinc-800 dark:text-zinc-200">{fmt(p.amount)} XOF</span>
                        <span className="text-[10px] text-zinc-400 w-8 text-right">{p.share}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${PAYMENT_COLORS[p.method] ?? "bg-zinc-400"}`}
                        style={{ width: `${p.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline horaire */}
          <Card className="p-5">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité par Heure
            </h3>
            {loading ? (
              <div className="h-28 flex items-center justify-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (overview?.timeline ?? []).length === 0 ? (
              <div className="h-28 flex items-center justify-center text-zinc-400 text-xs font-bold">Aucune activité aujourd'hui</div>
            ) : (
              <>
                {/* Légende max */}
                <div className="flex justify-end mb-1">
                  <span className="text-[9px] font-bold text-zinc-400">{fmt(maxTimeline)} XOF</span>
                </div>
                {/* Barres — hauteur en px (% ne fonctionne pas sur parent sans hauteur fixe) */}
                <div className="flex items-end gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-1" style={{ height: "80px" }}>
                  {(overview?.timeline ?? []).map((t) => {
                    const barH = Math.max(4, Math.round((t.revenue / maxTimeline) * 72));
                    const isMax = t.revenue === maxTimeline;
                    return (
                      <div
                        key={t.hour}
                        className="group flex flex-col items-center flex-1 min-w-0 justify-end h-full"
                      >
                        {/* Tooltip valeur */}
                        <span className="text-[8px] font-black text-primary mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                          {fmt(t.revenue)}
                        </span>
                        {/* Barre */}
                        <div
                          title={`${t.hour} · ${fmt(t.revenue)} XOF · ${t.transactionCount} vente${t.transactionCount > 1 ? "s" : ""}`}
                          className={`w-full rounded-t transition-all duration-300 cursor-default group-hover:opacity-90 ${isMax ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/60"}`}
                          style={{ height: `${barH}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Labels heure */}
                <div className="flex gap-1 mt-1">
                  {(overview?.timeline ?? []).map((t) => (
                    <span key={t.hour} className="flex-1 min-w-0 text-[9px] font-bold text-zinc-400 text-center truncate">
                      {t.hour.replace(":00", "h")}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Dernières ventes ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dernières Ventes
            </h3>
            <Link
              href="/super/commandes"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
          ) : (overview?.recentSales ?? []).length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-xs font-bold">
              Aucune vente enregistrée aujourd&apos;hui
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(overview?.recentSales ?? []).map((sale) => {
                const isPaid = sale.status === "COMPLETED";
                return (
                  <div key={sale.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${isPaid ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "bg-red-50 dark:bg-red-950/20 text-red-500"}`}>
                        <Receipt className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">{sale.receiptNumber}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-zinc-400">
                            {new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">·</span>
                          <span className="text-[10px] font-bold text-zinc-400">{sale.itemCount} article{sale.itemCount > 1 ? "s" : ""}</span>
                          <span className="text-[10px] font-bold text-zinc-400">·</span>
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                            {PAYMENT_ICONS[sale.paymentMethod]}
                            {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-sm font-black ${isPaid ? "text-primary" : "text-red-500 line-through"}`}>
                        {fmt(sale.totalAmount)} XOF
                      </span>
                      {isPaid && (
                        <>
                          <button
                            onClick={() => openVoid(sale)}
                            title="Annuler la vente"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openRefund(sale)}
                            title="Rembourser"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Raccourcis modules ── */}
        <div>
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Accès Rapide</h3>
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {modules.map((mod, idx) => (
              <Link href={mod.href} key={idx} className="w-full">
                <Card
                  hoverable
                  className={`flex flex-col justify-between transition-all duration-300 group rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl p-3 items-center text-center h-auto border-t-4 sm:border-t-0 sm:border-l-4 ${mod.color}`}
                >
                  <div className="flex sm:w-full items-center justify-between mb-2 sm:mb-4">
                    <div className={`p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 ${mod.bgLight} sm:bg-zinc-50 rounded-xl sm:rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      {mod.icon}
                    </div>
                    <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center sm:items-start w-full min-w-0">
                    <h3 className="text-[11px] sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase sm:normal-case line-clamp-1">
                      <span className="block sm:hidden">{mod.title}</span>
                      <span className="hidden sm:block">{mod.fullTitle}</span>
                    </h3>
                    <p className="hidden sm:block text-xs font-bold text-zinc-500 leading-relaxed mt-1 text-left">
                      {mod.description}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ══ MODAL ANNULATION ══ */}
      <Modal
        isOpen={isVoidOpen}
        onClose={() => { setIsVoidOpen(false); setVoidReason(""); }}
        title="Annuler la vente"
        size="sm"
      >
        {voidSale && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-black text-red-800 dark:text-red-400">
                  {voidSale.receiptNumber} — {fmt(voidSale.totalAmount)} XOF
                </p>
                <p className="text-[11px] text-red-700/80 dark:text-red-500">
                  Le stock des articles sera restitué automatiquement. Action irréversible.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Raison <span className="text-red-500">*</span>
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ex : Erreur de saisie, client a changé d'avis…"
                rows={3}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-red-400 transition-all resize-none"
              />
              <p className="text-[10px] text-zinc-400">{voidReason.trim().length} / minimum 5 caractères</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsVoidOpen(false)} disabled={isVoidSubmitting}>
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                onClick={handleVoid}
                loading={isVoidSubmitting}
                disabled={voidReason.trim().length < 5}
              >
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ MODAL REMBOURSEMENT ══ */}
      <Modal
        isOpen={isRefundOpen}
        onClose={() => { setIsRefundOpen(false); setRefundSale(null); }}
        title="Rembourser la vente"
        size="sm"
      >
        {refundSale && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs">
              <div>
                <p className="font-black text-foreground">{refundSale.receiptNumber}</p>
                <p className="text-zinc-400 mt-0.5">{refundSale.itemCount} article{refundSale.itemCount > 1 ? "s" : ""}</p>
              </div>
              <span className="text-sm font-black text-violet-600">{fmt(refundSale.totalAmount)} XOF</span>
            </div>

            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/30 rounded-xl text-[11px] text-violet-700 dark:text-violet-400 font-bold">
              Remboursement total. Pour un remboursement partiel, utilisez la page <span className="font-black underline">Historique des Ventes</span>.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Méthode de remboursement <span className="text-red-500">*</span>
              </label>
              <select
                value={refundPaymentMethod}
                onChange={(e) => setRefundPaymentMethod(e.target.value as typeof refundPaymentMethod)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${returnToStock ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"}`}>
                {returnToStock && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
              <input type="checkbox" checked={returnToStock} onChange={(e) => setReturnToStock(e.target.checked)} className="sr-only" />
              <div>
                <p className="text-xs font-black text-foreground">Remettre les articles en stock</p>
                <p className="text-[10px] text-zinc-400">Décocher si produit défectueux</p>
              </div>
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Raison <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex : Client insatisfait, produit défectueux…"
                rows={2}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setIsRefundOpen(false)} disabled={isRefundSubmitting}>
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-violet-600 hover:bg-violet-700 border-violet-600"
                onClick={handleRefund}
                loading={isRefundSubmitting}
                disabled={refundReason.trim().length < 5}
              >
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
