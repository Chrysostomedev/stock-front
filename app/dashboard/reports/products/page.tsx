"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportsService, {
  ProductSalesSummaryResponse,
  ProductSalesSummaryItem,
} from "@/services/reports.service";
import CategoryService, { Category } from "@/services/category.service";
import { downloadReport } from "@/services/export.service";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  FileDown,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ProductSalesSummaryPage() {
  const { showToast } = useToast();
  const { shopId, shopName } = useDashboardShop();

  // Données
  const [data, setData] = useState<ProductSalesSummaryResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "quantity" | "profit" | "name">("revenue");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const d = new Date();
    d.setDate(1); // 1er jour du mois
    setFromDate(d.toISOString().split("T")[0]);
    setToDate(new Date().toISOString().split("T")[0]);
  }, []);

  // État d'export
  const [isExporting, setIsExporting] = useState<"pdf" | "xlsx" | null>(null);

  // Chargement des catégories
  useEffect(() => {
    CategoryService.getAll()
      .then((res) => {
        const list = res.data && Array.isArray(res.data) ? res.data : [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  // Chargement des données d'analyse
  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await ReportsService.getProductSalesSummary({
        shopId,
        fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
        categoryId: categoryId || undefined,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setData(res);
    } catch {
      showToast("Erreur lors de la récupération de l'analyse des ventes par produit", "error");
    } finally {
      setLoading(false);
    }
  }, [shopId, fromDate, toDate, categoryId, search, sortBy, sortOrder, page, limit, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export PDF ou Excel
  const handleExport = async (format: "pdf" | "xlsx") => {
    if (!shopId) return;
    setIsExporting(format);
    try {
      await downloadReport(
        "/reports/sales/products-summary/export",
        {
          shopId,
          format,
          fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
          toDate: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
          categoryId: categoryId || undefined,
          search: search.trim() || undefined,
          sortBy,
          sortOrder,
        },
        `analyse-ventes-produits-${shopId}.${format}`
      );
      showToast(`Export ${format.toUpperCase()} généré avec succès`, "success");
    } catch {
      showToast(`Échec du téléchargement du fichier ${format.toUpperCase()}`, "error");
    } finally {
      setIsExporting(null);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: data?.shop?.currency || "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  const summary = data?.summary;
  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <AppLayout
      title="Analyse des Ventes par Produit"
      subtitle="Chiffre d'affaires, marges brutes et rentabilité produit par produit"
      backUrl="/dashboard"
    >
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 md:pb-12">
        {/* ── Entête & Boutons d'Export ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">
                Analyse & Marges par Produit
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Boutique : <span className="font-bold text-foreground">{shopName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isExporting !== null}
              className="rounded-xl h-10 px-3.5 text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
            >
              <FileDown className={`h-4 w-4 mr-1.5 ${isExporting === "pdf" ? "animate-spin" : ""}`} />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("xlsx")}
              disabled={isExporting !== null}
              className="rounded-xl h-10 px-3.5 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
            >
              <FileSpreadsheet className={`h-4 w-4 mr-1.5 ${isExporting === "xlsx" ? "animate-spin" : ""}`} />
              Export Excel
            </Button>
          </div>
        </div>

        {/* ── KPI Cards Marges & Ventes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Chiffre d&apos;Affaires Total
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-foreground">
                {fmtCurrency(summary?.totalRevenue ?? 0)}
              </span>
              <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                {summary?.totalUnitsSold ?? 0} unités vendues ({summary?.totalProductsSold ?? 0} réf.)
              </p>
            </div>
          </Card>
          <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Coût des Ventes (COGS)
              </span>
              <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-foreground">
                {fmtCurrency(summary?.totalCost ?? 0)}
              </span>
              <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                Prix d&apos;achat total des articles vendus
              </p>
            </div>
          </Card>
          <Card className="p-4.5 rounded-2xl border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Bénéfice Brut Réalisé
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-emerald-600">
                {fmtCurrency(summary?.totalGrossProfit ?? 0)}
              </span>
              <p className="text-[11px] font-black text-emerald-500 mt-0.5">
                Chiffre d&apos;affaires − Coût d&apos;achat
              </p>
            </div>
          </Card>

          <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Taux de Marge Moyen
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span
                className={`text-2xl font-black ${
                  (summary?.averageMarginRate ?? 0) >= 25
                    ? "text-emerald-600"
                    : (summary?.averageMarginRate ?? 0) >= 15
                    ? "text-amber-500"
                    : "text-rose-600"
                }`}
              >
                {summary?.averageMarginRate != null
                  ? `${summary.averageMarginRate.toFixed(1)}%`
                  : "0%"}
              </span>
              <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                Rentabilité brute moyenne
              </p>
            </div>
          </Card>
        </div>

        {/* ── Barre de Filtres et Tris ── */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 flex-wrap">
          {/* Recherche */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Recherche produit, code ou SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {/* Période */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Du</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
              />
              <span className="text-[11px] font-bold text-muted-foreground">Au</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
              />
            </div>

            {/* Catégorie */}
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
            >
              <option value="revenue">Trier par Chiffre d&apos;Affaires</option>
              <option value="profit">Trier par Bénéfice Brut</option>
              <option value="quantity">Trier par Unités Vendues</option>
              <option value="name">Trier par Nom Produit</option>
            </select>

            {/* Ordre */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Inverser l'ordre de tri"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortOrder === "desc" ? "Décroissant" : "Croissant"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl h-8 px-2.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ── Tableau Analytique Détaillé ── */}
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4 text-center">Stock Actuel</th>
                  <th className="py-3 px-4 text-center">Unités Vendues</th>
                  <th className="py-3 px-4 text-right">CA Réalisé</th>
                  <th className="py-3 px-4 text-right">Coût d&apos;Achat (COGS)</th>
                  <th className="py-3 px-4 text-right">Bénéfice Brut</th>
                  <th className="py-3 px-4 text-center">Marge %</th>
                  <th className="py-3 px-4 text-center">Ventes (Tx)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span>Calcul de l&apos;analyse des ventes en cours...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground font-bold">
                      Aucune vente enregistrée pour ces filtres sur la période sélectionnée
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const margin = Number(item.marginRate ?? 0);
                    const isProfitable = item.grossProfit > 0;
                    return (
                      <tr key={item.productId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-black text-foreground">{item.productName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.barcode && (
                                <span className="text-[10px] text-zinc-400 font-bold">
                                  {item.barcode}
                                </span>
                              )}
                              {item.sku && (
                                <span className="text-[10px] text-primary/80 font-bold">
                                  • {item.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground font-bold">
                          {item.categoryName || "Général"}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-foreground">
                          {item.currentStock}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-black text-foreground">
                            {item.unitsSold}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-black text-foreground">
                          {fmtCurrency(item.revenue)}
                        </td>

                        <td className="py-3 px-4 text-right text-muted-foreground font-bold">
                          {fmtCurrency(item.cogs)}
                        </td>

                        <td className="py-3 px-4 text-right font-black">
                          <span className={isProfitable ? "text-emerald-600" : "text-rose-600"}>
                            {fmtCurrency(item.grossProfit)}
                          </span>
                        </td>

                        {/* Marge % avec indicateur visuel */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`font-black text-[11px] ${
                                margin >= 25
                                  ? "text-emerald-600"
                                  : margin >= 15
                                  ? "text-amber-500"
                                  : "text-rose-600"
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                            <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  margin >= 25
                                    ? "bg-emerald-500"
                                    : margin >= 15
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center text-muted-foreground font-bold">
                          {item.transactionCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-muted-foreground font-bold">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} articles)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-xl h-8 px-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-xl h-8 px-2.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
