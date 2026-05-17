"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import ShopService, { Shop } from "@/services/shop.service";
import ProductService from "@/services/product.service";
import SaleService from "@/services/sale.service";
import ExpenseService from "@/services/expense.service";
import {
  TrendingUp,
  DollarSign,
  Layers,
  Building2,
  Calendar,
  TrendingDown,
  Percent,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  CreditCard
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
  revenueHistory: number[]; // Points aligned with selected period
  historyLabels: string[];
  paymentBreakdown: { CASH: number; MOBILE: number; CARD: number };
  categoryBreakdown: Record<string, number>;
  expenseList: any[];
}

export default function AdminBilanPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<BoutiqueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("7days");

  // Detailed modal view for a specific boutique
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
            // Load products
            const prodRes = await ProductService.getAll({ shopId: shop.id });
            const prods = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];

            // Load sales
            const salesRes = await SaleService.getAll({ shopId: shop.id });
            const sales = Array.isArray(salesRes) ? salesRes : salesRes?.data || [];

            // Load expenses
            const expRes = await ExpenseService.getAll({ shopId: shop.id });
            const expenses = Array.isArray(expRes) ? expRes : expRes?.data || [];

            // 1. Stock values
            let stockQtyTotal = 0;
            let stockPurchaseVal = 0;
            let stockSellingVal = 0;

            prods.forEach((p: any) => {
              const qty = p.stockQty || p.stockQuantity || 0;
              stockQtyTotal += qty;
              stockPurchaseVal += qty * (p.buyingPrice || 0);
              stockSellingVal += qty * (p.sellingPrice || 0);
            });

            // 2. Period Filter Criteria
            const now = new Date();
            const filteredSales = sales.filter((sale: any) => {
              const saleDate = new Date(sale.createdAt || sale.date);
              if (period === "7days") {
                const diff = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
                return diff <= 7;
              } else if (period === "month") {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
              } else if (period === "year") {
                return saleDate.getFullYear() === now.getFullYear();
              }
              return true; // "all"
            });

            const filteredExpenses = expenses.filter((exp: any) => {
              const expDate = new Date(exp.createdAt || exp.date);
              if (period === "7days") {
                const diff = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
                return diff <= 7;
              } else if (period === "month") {
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
              } else if (period === "year") {
                return expDate.getFullYear() === now.getFullYear();
              }
              return true; // "all"
            });

            // 3. Sales / COGS / Payment / Category calculations
            let totalRevenue = 0;
            let costOfGoodsSold = 0;
            let salesCount = 0;
            const paymentBreakdown = { CASH: 0, MOBILE: 0, CARD: 0 };
            const categoryBreakdown: Record<string, number> = {};

            // Dynamic graph points calculation
            let historyPointsCount = 7;
            let revenueHistory = Array(7).fill(0);
            let historyLabels: string[] = [];

            if (period === "7days") {
              historyPointsCount = 7;
              revenueHistory = Array(7).fill(0);
              historyLabels = ["J-6", "J-5", "J-4", "J-3", "J-2", "Hier", "Auj"];
            } else if (period === "month") {
              historyPointsCount = 4;
              revenueHistory = Array(4).fill(0); // Weeks of the month
              historyLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
            } else if (period === "year") {
              historyPointsCount = 12;
              revenueHistory = Array(12).fill(0); // Months of the year
              historyLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            } else {
              historyPointsCount = 3;
              revenueHistory = Array(3).fill(0); // Last 3 years
              historyLabels = ["2024", "2025", "2026"];
            }

            filteredSales.forEach((sale: any) => {
              const rev = sale.finalAmount || sale.totalAmount || sale.total || 0;
              totalRevenue += rev;
              salesCount++;

              // Payment breakdown
              const payments = sale.payments || [];
              payments.forEach((pay: any) => {
                const method = pay.method || "CASH";
                if (method.includes("MOBILE")) paymentBreakdown.MOBILE += pay.amount || 0;
                else if (method.includes("CARD")) paymentBreakdown.CARD += pay.amount || 0;
                else paymentBreakdown.CASH += pay.amount || 0;
              });

              // COGS and Category breakdown based on sold items lookup
              const items = sale.items || [];
              items.forEach((item: any) => {
                const matchedProd = prods.find((p: any) => p.id === item.productId);
                const buyPrice = matchedProd ? matchedProd.buyingPrice || 0 : 0;
                costOfGoodsSold += (item.quantity || 0) * buyPrice;

                // Category allocation
                const catName = matchedProd?.category?.name || "Autres Matériaux";
                categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + (item.quantity || 0) * (item.unitPrice || 0);
              });

              // Map revenue to corresponding history point
              const saleDate = new Date(sale.createdAt || sale.date);
              if (period === "7days") {
                const diffDays = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                  revenueHistory[6 - diffDays] += rev;
                }
              } else if (period === "month") {
                const weekIdx = Math.min(3, Math.floor(saleDate.getDate() / 7));
                revenueHistory[weekIdx] += rev;
              } else if (period === "year") {
                const monthIdx = saleDate.getMonth();
                revenueHistory[monthIdx] += rev;
              } else {
                const yearDiff = 2026 - saleDate.getFullYear();
                if (yearDiff >= 0 && yearDiff < 3) {
                  revenueHistory[2 - yearDiff] += rev;
                }
              }
            });

            // 4. Expenses total
            const totalExpenses = filteredExpenses.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);

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
              expenseList: filteredExpenses
            };
          } catch (err) {
            console.error(`Error loading report for shop ${shop.name}:`, err);
            return null;
          }
        })
      );

      setReports(computedReports.filter((r): r is BoutiqueReport => r !== null));
    } catch (error) {
      showToast("Impossible de charger les statistiques périodiques.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilanData();
  }, [period]);

  // Aggregated Globals
  const globalCA = reports.reduce((acc, r) => acc + r.totalRevenue, 0);
  const globalProfit = reports.reduce((acc, r) => acc + r.netProfit, 0);
  const globalExpenses = reports.reduce((acc, r) => acc + r.totalExpenses, 0);
  const globalStockVal = reports.reduce((acc, r) => acc + r.stockSellingVal, 0);
  const globalStockCost = reports.reduce((acc, r) => acc + r.stockPurchaseVal, 0);
  const globalPotentialProfit = globalStockVal - globalStockCost;

  // Simple SVG Line graph points computation
  const getPointsStr = (hist: number[], maxVal: number, width: number, height: number) => {
    if (maxVal === 0) return "";
    const len = hist.length - 1;
    return hist
      .map((val, idx) => {
        const x = (idx / len) * width;
        const y = height - (val / maxVal) * height;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const maxHistoryValue = Math.max(...reports.flatMap((r) => r.revenueHistory), 1000);

  // Colors mapping for boutiques (expanded to 20 colors to support many shops seamlessly)
  const shopColors = [
    { primary: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6" }, // Blue
    { primary: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "#10b981" }, // Emerald
    { primary: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b" }, // Amber
    { primary: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", border: "#ec4899" }, // Pink
    { primary: "#6366f1", bg: "rgba(99, 102, 241, 0.1)", border: "#6366f1" }, // Indigo
    { primary: "#14b8a6", bg: "rgba(20, 184, 166, 0.1)", border: "#14b8a6" }, // Teal
    { primary: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", border: "#8b5cf6" }, // Purple
    { primary: "#f97316", bg: "rgba(249, 115, 22, 0.1)", border: "#f97316" }, // Orange
    { primary: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)", border: "#06b6d4" }, // Cyan
    { primary: "#d946ef", bg: "rgba(217, 70, 239, 0.1)", border: "#d946ef" }, // Fuchsia
    { primary: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", border: "#a855f7" }, // Violet
    { primary: "#84cc16", bg: "rgba(132, 204, 22, 0.1)", border: "#84cc16" }, // Lime
    { primary: "#eab308", bg: "rgba(234, 179, 8, 0.1)", border: "#eab308" }, // Yellow
    { primary: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444" }, // Red
    { primary: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "#0ea5e9" }, // Sky
    { primary: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", border: "#22c55e" }, // Green
    { primary: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)", border: "#f43f5e" }, // Rose
    { primary: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "#10b981" }, // Emerald Light
    { primary: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6" }, // Ocean Blue
    { primary: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", border: "#8b5cf6" }, // Soft Violet
  ];

  return (
    <AppLayout
      title="Bilan Financier & Audit"
      subtitle="Supervision comptable approfondie et analyse des bénéfices périodiques"
      rightElement={
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector dropdown */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black outline-none focus:border-primary transition-all shadow-md"
          >
            <option value="7days"> 7 Derniers Jours</option>
            <option value="month"> Mois en Cours</option>
            <option value="year"> Année en Cours</option>
            <option value="all"> Tout l'Historique</option>
          </select>
          <Button onClick={loadBilanData} variant="secondary" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Chiffre d'Affaires CA
                </p>
                <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                  {globalCA.toLocaleString()} XOF
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>CA brut pour la période sélectionnée</span>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Bénéfices Nets Réels
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {globalProfit.toLocaleString()} XOF
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-400">
              <Percent className="h-3.5 w-3.5 text-emerald-500" />
              <span>Prend en compte le coût des marchandises & charges</span>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Charges & Dépenses
                </p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {globalExpenses.toLocaleString()} XOF
                </h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-550">
              <span>Coûts logistiques et salaires inclus</span>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Marge Inventaire Potentielle
                </p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {globalPotentialProfit.toLocaleString()} XOF
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <Layers className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-400">
              <span>Marge brute latente si tout le stock est vendu</span>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Curve / Line chart */}
          <Card className="lg:col-span-2 shadow-xl border-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
                  Évolution du Chiffre d'Affaires
                </h3>
                <p className="text-xs text-zinc-400">Tendance chronologique des ventes globales</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="relative">
                {/* SVG Graph */}
                <svg className="w-full h-64 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 50, 100, 150, 200].map((yVal) => (
                    <line
                      key={yVal}
                      x1="0"
                      y1={yVal}
                      x2="500"
                      y2={yVal}
                      stroke="rgba(120, 120, 120, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Draw curve for each shop */}
                  {reports.map((rep, index) => {
                    const color = shopColors[index % shopColors.length];
                    const pts = getPointsStr(rep.revenueHistory, maxHistoryValue, 500, 200);
                    if (!pts) return null;

                    return (
                      <g key={rep.shop.id}>
                        {/* Area Gradient under line */}
                        <path
                          d={`M0,200 L${pts} L500,200 Z`}
                          fill={color.bg}
                          className="transition-all duration-500"
                        />
                        {/* Stroke Path */}
                        <polyline
                          fill="none"
                          stroke={color.primary}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pts}
                          className="transition-all duration-500"
                        />
                        {/* Interactive dots */}
                        {rep.revenueHistory.map((val, idx) => {
                          const len = rep.revenueHistory.length - 1;
                          const x = (idx / len) * 500;
                          const y = 200 - (val / maxHistoryValue) * 200;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#fff"
                              stroke={color.primary}
                              strokeWidth="3"
                              className="cursor-pointer hover:r-7 transition-all"
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>

                {/* X Axis labels dynamic */}
                <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  {reports[0]?.historyLabels.map((lbl, i) => (
                    <span key={i}>{lbl}</span>
                  ))}
                </div>

                {/* Chart Legends (Scrollable container to handle up to 20+ shops seamlessly) */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center max-h-16 overflow-y-auto pr-1">
                  {reports.map((rep, index) => {
                    const color = shopColors[index % shopColors.length];
                    return (
                      <div key={rep.shop.id} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.primary }} />
                        <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400">
                          {rep.shop.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Donut Chart / Circular distribution */}
          <Card className="shadow-xl border-none">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider mb-2">
              Parts du Chiffre d'Affaires
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Répartition par point de vente</p>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-44 h-44">
                  {/* SVG Pie/Donut Chart */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(120, 120, 120, 0.05)" strokeWidth="6" />

                    {(() => {
                      let accumulatedPercentage = 0;
                      return reports.map((rep, idx) => {
                        const color = shopColors[idx % shopColors.length];
                        const percentage = globalCA > 0 ? (rep.totalRevenue / globalCA) * 100 : 0;
                        if (percentage === 0) return null;

                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = 100 - accumulatedPercentage;
                        accumulatedPercentage += percentage;

                        return (
                          <circle
                            key={rep.shop.id}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={color.primary}
                            strokeWidth="6"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-700 hover:stroke-7"
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Inner text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total CA</span>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {globalCA.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Percentage list (Scrollable container to prevent layout deforming with many shops) */}
                <div className="w-full flex flex-col gap-2 mt-6 max-h-40 overflow-y-auto pr-1">
                  {reports.map((rep, idx) => {
                    const color = shopColors[idx % shopColors.length];
                    const percentage = globalCA > 0 ? ((rep.totalRevenue / globalCA) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={rep.shop.id} className="flex items-center justify-between text-xs px-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color.primary }} />
                          <span className="font-bold text-zinc-600 dark:text-zinc-400">{rep.shop.name}</span>
                        </div>
                        <span className="font-black text-zinc-800 dark:text-zinc-200">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Dynamic Comparative Table with Expandable Details */}
        <Card className="shadow-xl border-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
                Bilan Comptable des Points de Vente
              </h3>
              <p className="text-xs text-zinc-400">Cliquez sur "Consulter" pour ouvrir le rapport d'audit détaillé de la boutique</p>
            </div>
          </div>

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
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/45 text-zinc-650 dark:text-zinc-400">
                {reports.map((rep, idx) => {
                  const color = shopColors[idx % shopColors.length];
                  return (
                    <tr key={rep.shop.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/10">
                      <td className="py-4 px-4 font-black text-zinc-850 dark:text-zinc-150 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.primary }} />
                        {rep.shop.name}
                      </td>
                      <td className="py-4 px-4 text-center font-mono">{rep.salesCount}</td>
                      <td className="py-4 px-4 text-right font-mono text-indigo-500">{rep.totalRevenue.toLocaleString()} XOF</td>
                      <td className="py-4 px-4 text-right font-mono">{rep.costOfGoodsSold.toLocaleString()} XOF</td>
                      <td className="py-4 px-4 text-right font-mono text-rose-500">{rep.totalExpenses.toLocaleString()} XOF</td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {rep.netProfit >= 0 ? "+" : ""}
                        {rep.netProfit.toLocaleString()} XOF
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => {
                            setSelectedBoutique(rep);
                            setIsDetailOpen(true);
                          }}
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
        </Card>
      </div>

      {/* Boutique Audit Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Rapport d'Audit Financier : ${selectedBoutique?.shop.name}`}
        size="lg"
      >
        {selectedBoutique && (
          <div className="flex flex-col gap-6 text-xs font-bold">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-450 uppercase tracking-widest">Panier Moyen</span>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 mt-1">
                  {selectedBoutique.salesCount > 0
                    ? Math.round(selectedBoutique.totalRevenue / selectedBoutique.salesCount).toLocaleString()
                    : 0}{" "}
                  XOF
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-450 uppercase tracking-widest">Taux de Marge Net</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {selectedBoutique.totalRevenue > 0
                    ? ((selectedBoutique.netProfit / selectedBoutique.totalRevenue) * 100).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center">
                <span className="text-[10px] text-zinc-450 uppercase tracking-widest">Total Articles Stock</span>
                <p className="text-sm font-black text-indigo-500 mt-1">
                  {selectedBoutique.stockQtyTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment methods breakdown */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Répartition des encaissements</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase">Espèces</span>
                    <p className="font-mono text-zinc-800 dark:text-zinc-200">{selectedBoutique.paymentBreakdown.CASH.toLocaleString()} XOF</p>
                  </div>
                </div>
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase">Mobile Money</span>
                    <p className="font-mono text-zinc-800 dark:text-zinc-200">{selectedBoutique.paymentBreakdown.MOBILE.toLocaleString()} XOF</p>
                  </div>
                </div>
                <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase">Cartes Bancaires</span>
                    <p className="font-mono text-zinc-800 dark:text-zinc-200">{selectedBoutique.paymentBreakdown.CARD.toLocaleString()} XOF</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation par catégories */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Chiffre d'Affaires par catégories</h4>
              <div className="flex flex-col gap-2">
                {Object.entries(selectedBoutique.categoryBreakdown).length === 0 ? (
                  <p className="text-xs text-zinc-450 italic text-center p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg">Aucune vente enregistrée sur cette période.</p>
                ) : (
                  Object.entries(selectedBoutique.categoryBreakdown).map(([cat, val], idx) => {
                    const pct = selectedBoutique.totalRevenue > 0 ? (val / selectedBoutique.totalRevenue) * 100 : 0;
                    return (
                      <div key={cat} className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-zinc-650 dark:text-zinc-350">{cat}</span>
                          <span className="text-zinc-850 dark:text-zinc-150">{val.toLocaleString()} XOF ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expenses List breakdown */}
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Registre des dépenses de la boutique</h4>
              {selectedBoutique.expenseList.length === 0 ? (
                <p className="text-xs text-zinc-450 italic text-center p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg">Aucune dépense enregistrée sur cette période.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-zinc-150 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800">
                  {selectedBoutique.expenseList.map((exp, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-zinc-50/40">
                      <div>
                        <p className="text-zinc-800 dark:text-zinc-200">{exp.description || "Dépense boutique"}</p>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{exp.category || "Général"}</p>
                      </div>
                      <span className="font-mono text-rose-500">-{exp.amount.toLocaleString()} XOF</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-4">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
