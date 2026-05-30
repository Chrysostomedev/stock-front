"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import ShopService, { Shop } from "@/services/shop.service";
import ProductService from "@/services/product.service";
import SaleService from "@/services/sale.service";
import ExpenseService from "@/services/expense.service";
import {
  RefreshCw,
  Eye,
  Wallet,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Store,
  BarChart2,
} from "lucide-react";

type PeriodType = "7days" | "month" | "year" | "all";

interface BoutiqueReport {
  shop: Shop;
  salesCount: number;
  totalRevenue: number;
  totalExpenses: number;
  costOfGoodsSold: number;
  grossProfit: number;
  netProfit: number;
  stockQtyTotal: number;
  stockPurchaseVal: number;
  stockSellingVal: number;
  potentialProfit: number;
  revenueHistory: number[];
  historyLabels: string[];
  paymentBreakdown: { CASH: number; MOBILE: number; CARD: number };
  categoryBreakdown: Record<string, number>;
  expenseList: any[];
}

// ─── Utilitaire : forcer un nombre (évite la concaténation string) ───
const toNum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

// ─── Hook réactif mobile ───
function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < bp);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [bp]);
  return isMobile;
}

const shopColors = [
  { primary: "#3b82f6" }, { primary: "#10b981" }, { primary: "#f59e0b" },
  { primary: "#ec4899" }, { primary: "#6366f1" }, { primary: "#14b8a6" },
  { primary: "#8b5cf6" }, { primary: "#f97316" }, { primary: "#06b6d4" },
  { primary: "#d946ef" },
];

export default function AdminBilanPage() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [reports, setReports] = useState<BoutiqueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("7days");
  const [selectedBoutique, setSelectedBoutique] = useState<BoutiqueReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadBilanData = async () => {
    setLoading(true);
    try {
      const activeShops = await ShopService.getAll().then((res) =>
        (Array.isArray(res) ? res : res?.data || []).filter((s: Shop) => s.isActive)
      );

      const computedReports = await Promise.all(
        activeShops.map(async (shop: Shop) => {
          try {
            const prodRes = await ProductService.getAll({ shopId: shop.id });
            const prods = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];

            const salesRes = await SaleService.getAll({ shopId: shop.id });
            const sales = Array.isArray(salesRes) ? salesRes : salesRes?.data || [];

            const expRes = await ExpenseService.getAll({ shopId: shop.id });
            const expenses = Array.isArray(expRes) ? expRes : expRes?.data || [];

            // ── Stock ──
            let stockQtyTotal = 0;
            let stockPurchaseVal = 0;
            let stockSellingVal = 0;
            prods.forEach((p: any) => {
              const qty = toNum(p.stockQty ?? p.stockQuantity);
              stockQtyTotal += qty;
              stockPurchaseVal += qty * toNum(p.buyingPrice);
              stockSellingVal += qty * toNum(p.sellingPrice);
            });

            // ── Filtre période ──
            const now = new Date();
            const inPeriod = (dateStr: any) => {
              const d = new Date(dateStr);
              if (period === "7days") return (now.getTime() - d.getTime()) / 86400000 <= 7;
              if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              if (period === "year") return d.getFullYear() === now.getFullYear();
              return true;
            };

            const filteredSales = sales.filter((s: any) => inPeriod(s.createdAt ?? s.date));
            const filteredExpenses = expenses.filter((e: any) => inPeriod(e.createdAt ?? e.date));

            // ── Labels historique ──
            let revenueHistory: number[];
            let historyLabels: string[];
            if (period === "7days") {
              revenueHistory = Array(7).fill(0);
              historyLabels = ["J-6", "J-5", "J-4", "J-3", "J-2", "Hier", "Auj"];
            } else if (period === "month") {
              revenueHistory = Array(4).fill(0);
              historyLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
            } else if (period === "year") {
              revenueHistory = Array(12).fill(0);
              historyLabels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
            } else {
              revenueHistory = Array(3).fill(0);
              historyLabels = ["2024", "2025", "2026"];
            }

            // ── Calculs ventes ──
            let totalRevenue = 0;      // ← FIX: initialisé à 0 (number)
            let costOfGoodsSold = 0;
            let salesCount = 0;
            const paymentBreakdown = { CASH: 0, MOBILE: 0, CARD: 0 };
            const categoryBreakdown: Record<string, number> = {};

            filteredSales.forEach((sale: any) => {
              // ← FIX clé : toNum() force la conversion en number
              const rev = toNum(sale.finalAmount ?? sale.totalAmount ?? sale.total);
              totalRevenue += rev;     // addition numérique, plus jamais de concaténation
              salesCount++;

              // Paiements
              const payments: any[] = sale.payments || [];
              payments.forEach((pay: any) => {
                const method: string = pay.method || "CASH";
                const amt = toNum(pay.amount);
                if (method.includes("MOBILE")) paymentBreakdown.MOBILE += amt;
                else if (method.includes("CARD")) paymentBreakdown.CARD += amt;
                else paymentBreakdown.CASH += amt;
              });

              // COGS & catégories
              const items: any[] = sale.items || [];
              items.forEach((item: any) => {
                const matched = prods.find((p: any) => p.id === item.productId);
                const buyPrice = toNum(matched?.buyingPrice);
                costOfGoodsSold += toNum(item.quantity) * buyPrice;
                const catName = matched?.category?.name || "Autres";
                categoryBreakdown[catName] =
                  toNum(categoryBreakdown[catName]) +
                  toNum(item.quantity) * toNum(item.unitPrice);
              });

              // Historique
              const saleDate = new Date(sale.createdAt ?? sale.date);
              if (period === "7days") {
                const diff = Math.floor((now.getTime() - saleDate.getTime()) / 86400000);
                if (diff >= 0 && diff < 7) revenueHistory[6 - diff] += rev;
              } else if (period === "month") {
                const wk = Math.min(3, Math.floor((saleDate.getDate() - 1) / 7));
                revenueHistory[wk] += rev;
              } else if (period === "year") {
                revenueHistory[saleDate.getMonth()] += rev;
              } else {
                const yd = 2026 - saleDate.getFullYear();
                if (yd >= 0 && yd < 3) revenueHistory[2 - yd] += rev;
              }
            });

            // ← FIX: toNum() sur chaque dépense
            const totalExpenses = filteredExpenses.reduce(
              (acc: number, e: any) => acc + toNum(e.amount),
              0
            );

            const grossProfit = totalRevenue - costOfGoodsSold;
            const netProfit = grossProfit - totalExpenses;

            return {
              shop,
              salesCount,
              totalRevenue,
              totalExpenses,
              costOfGoodsSold,
              grossProfit,
              netProfit,
              stockQtyTotal,
              stockPurchaseVal,
              stockSellingVal,
              potentialProfit: stockSellingVal - stockPurchaseVal,
              revenueHistory,
              historyLabels,
              paymentBreakdown,
              categoryBreakdown,
              expenseList: filteredExpenses,
            };
          } catch (err) {
            console.error(`Erreur rapport ${shop.name}:`, err);
            return null;
          }
        })
      );

      setReports(computedReports.filter((r): r is BoutiqueReport => r !== null));
    } catch {
      showToast("Impossible de charger les statistiques périodiques.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBilanData(); }, [period]);

  // ── Totaux globaux ──
  const globalCA       = reports.reduce((a, r) => a + r.totalRevenue,   0);
  const globalProfit   = reports.reduce((a, r) => a + r.netProfit,       0);
  const globalExpenses = reports.reduce((a, r) => a + r.totalExpenses,   0);
  const globalStock    = reports.reduce((a, r) => a + r.stockSellingVal, 0);

  // ── Carte mobile par boutique ──
  const MobileReportCard = ({ rep, idx }: { rep: BoutiqueReport; idx: number }) => {
    const color = shopColors[idx % shopColors.length].primary;
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-sm pb-28 md:pb-4">
        {/* Header boutique */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              <Store className="h-4 w-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground truncate">{rep.shop.name}</p>
              {/* <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{rep.shop.type}</p> */}
            </div>
          </div>
          <span
            className="text-[10px] font-black px-2 py-1 rounded-lg"
            style={{ backgroundColor: color + "20", color }}
          >
            {rep.salesCount} ventes
          </span>
        </div>

        {/* KPIs en grille */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-3">
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold mb-1">Chiffre d'affaires</p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{fmt(rep.totalRevenue)}</p>
            <p className="text-[9px] text-indigo-300 font-bold">XOF</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3">
            <p className="text-[9px] text-rose-400 uppercase tracking-widest font-bold mb-1">Dépenses</p>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{fmt(rep.totalExpenses)}</p>
            <p className="text-[9px] text-rose-300 font-bold">XOF</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-3">
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Coût Achat</p>
            <p className="text-sm font-black text-zinc-700 dark:text-zinc-300">{fmt(rep.costOfGoodsSold)}</p>
            <p className="text-[9px] text-zinc-400 font-bold">XOF</p>
          </div>
          <div className={`rounded-xl p-3 ${rep.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
            <p className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${rep.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              Bénéfice Net
            </p>
            <p className={`text-sm font-black flex items-center gap-1 ${rep.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {rep.netProfit >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              {rep.netProfit >= 0 ? "+" : ""}{fmt(rep.netProfit)}
            </p>
            <p className={`text-[9px] font-bold ${rep.netProfit >= 0 ? "text-emerald-300" : "text-red-300"}`}>XOF</p>
          </div>
        </div>

        {/* Bouton détail */}
        <button
          onClick={() => { setSelectedBoutique(rep); setIsDetailOpen(true); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          Consulter le rapport d'audit
        </button>
      </div>
    );
  };

  return (
    <AppLayout
      title="Bilan Financier & Audit"
      subtitle="Supervision comptable approfondie et analyse des bénéfices périodiques"
      rightElement={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black outline-none focus:border-primary transition-all shadow-sm"
          >
            <option value="7days">7 Derniers Jours</option>
            <option value="month">Mois en Cours</option>
            <option value="year">Année en Cours</option>
            <option value="all">Tout l'Historique</option>
          </select>
          <Button onClick={loadBilanData} variant="secondary" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {!isMobile && "Actualiser"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">

        {/* ── KPIs globaux ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "CA Global", value: fmt(globalCA), unit: "XOF", color: "indigo" },
            { label: "Bénéfice Net", value: (globalProfit >= 0 ? "+" : "") + fmt(globalProfit), unit: "XOF", color: globalProfit >= 0 ? "emerald" : "red" },
            { label: "Dépenses", value: fmt(globalExpenses), unit: "XOF", color: "rose" },
            { label: "Val. Stock", value: fmt(globalStock), unit: "XOF", color: "amber" },
          ].map((kpi) => (
            <div key={kpi.label} className={`p-4 rounded-2xl bg-${kpi.color}-50 dark:bg-${kpi.color}-950/20 border border-${kpi.color}-100 dark:border-${kpi.color}-900/30`}>
              <p className={`text-[9px] font-black uppercase tracking-widest text-${kpi.color}-400 mb-1`}>{kpi.label}</p>
              <p className={`text-base font-black text-${kpi.color}-600 dark:text-${kpi.color}-400 leading-tight`}>{kpi.value}</p>
              <p className={`text-[9px] font-bold text-${kpi.color}-300`}>{kpi.unit}</p>
            </div>
          ))}
        </div>

        {/* ── Tableau / Cartes ── */}
        <Card className="shadow-xl border-none p-4 md:p-6">
          <div className="mb-5">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Bilan par Point de Vente
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isMobile ? "Appuyez sur « Consulter » pour le rapport détaillé" : "Cliquez sur Consulter pour ouvrir le rapport d'audit détaillé"}
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Calcul des bilans en cours...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center">
              <Store className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Aucune boutique active</p>
            </div>
          ) : isMobile ? (
            // ── Vue mobile : cartes ──
            <div className="flex flex-col gap-3">
              {reports.map((rep, idx) => (
                <MobileReportCard key={rep.shop.id} rep={rep} idx={idx} />
              ))}
            </div>
          ) : (
            // ── Vue desktop : tableau ──
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase tracking-widest text-[9px]">
                    <th className="py-4 px-4">Boutique</th>
                    <th className="py-4 px-4 text-center">Transactions</th>
                    <th className="py-4 px-4 text-right">Chiffre d'Affaires</th>
                    <th className="py-4 px-4 text-right">Coût Achat (COGS)</th>
                    <th className="py-4 px-4 text-right">Dépenses</th>
                    <th className="py-4 px-4 text-right text-emerald-500">Bénéfice Net</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/45">
                  {reports.map((rep, idx) => {
                    const color = shopColors[idx % shopColors.length].primary;
                    return (
                      <tr key={rep.shop.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/10">
                        <td className="py-4 px-4 font-black text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span>{rep.shop.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono">{rep.salesCount}</td>
                        <td className="py-4 px-4 text-right font-mono text-indigo-500">{fmt(rep.totalRevenue)} XOF</td>
                        <td className="py-4 px-4 text-right font-mono">{fmt(rep.costOfGoodsSold)} XOF</td>
                        <td className="py-4 px-4 text-right font-mono text-rose-500">{fmt(rep.totalExpenses)} XOF</td>
                        <td className={`py-4 px-4 text-right font-mono ${rep.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {rep.netProfit >= 0 ? "+" : ""}{fmt(rep.netProfit)} XOF
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            onClick={() => { setSelectedBoutique(rep); setIsDetailOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Consulter
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── MODAL Rapport d'Audit ── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Audit : ${selectedBoutique?.shop.name}`}
        size="lg"
      >
        {selectedBoutique && (
          <div className="flex flex-col gap-6 text-xs font-bold">

            {/* Métriques rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Panier Moyen</span>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 mt-1">
                  {selectedBoutique.salesCount > 0
                    ? fmt(Math.round(selectedBoutique.totalRevenue / selectedBoutique.salesCount))
                    : 0} XOF
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Taux de Marge Net</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {selectedBoutique.totalRevenue > 0
                    ? ((selectedBoutique.netProfit / selectedBoutique.totalRevenue) * 100).toFixed(1)
                    : "0.0"}%
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Articles en Stock</span>
                <p className="text-sm font-black text-indigo-500 mt-1">
                  {fmt(selectedBoutique.stockQtyTotal)}
                </p>
              </div>
            </div>

            {/* Encaissements */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                Répartition des encaissements
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Espèces", icon: <Wallet className="h-4 w-4" />, value: selectedBoutique.paymentBreakdown.CASH, color: "emerald" },
                  { label: "Mobile Money", icon: <ShoppingBag className="h-4 w-4" />, value: selectedBoutique.paymentBreakdown.MOBILE, color: "indigo" },
                  { label: "Carte Bancaire", icon: <CreditCard className="h-4 w-4" />, value: selectedBoutique.paymentBreakdown.CARD, color: "blue" },
                ].map((pm) => (
                  <div key={pm.label} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-3">
                    <div className={`p-2 bg-${pm.color}-500/10 text-${pm.color}-600 rounded-lg shrink-0`}>{pm.icon}</div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-400 uppercase block">{pm.label}</span>
                      <p className="font-mono text-zinc-800 dark:text-zinc-200 truncate">{fmt(pm.value)} XOF</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CA par catégories */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                Chiffre d'Affaires par catégories
              </h4>
              <div className="flex flex-col gap-2">
                {Object.entries(selectedBoutique.categoryBreakdown).length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg">
                    Aucune vente enregistrée sur cette période.
                  </p>
                ) : (
                  Object.entries(selectedBoutique.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, val]) => {
                      const pct = selectedBoutique.totalRevenue > 0
                        ? (val / selectedBoutique.totalRevenue) * 100
                        : 0;
                      return (
                        <div key={cat} className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate mr-2">{cat}</span>
                            <span className="text-zinc-800 dark:text-zinc-200 shrink-0">
                              {fmt(val)} XOF <span className="text-zinc-400">({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Registre des dépenses */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                Registre des dépenses
              </h4>
              {selectedBoutique.expenseList.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg">
                  Aucune dépense enregistrée sur cette période.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800">
                  {selectedBoutique.expenseList.map((exp, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 gap-3">
                      <div className="min-w-0">
                        <p className="text-zinc-800 dark:text-zinc-200 truncate">{exp.description || "Dépense boutique"}</p>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{exp.category || "Général"}</p>
                      </div>
                      <span className="font-mono text-rose-500 shrink-0">-{fmt(toNum(exp.amount))} XOF</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}