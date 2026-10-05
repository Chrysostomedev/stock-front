"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ProductService, { Product } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import InventoryService, {
  AdjustDiscrepanciesResponse,
  AdjustmentHistoryItem,
} from "@/services/inventory.service";
import {
  ClipboardCheck,
  BarChart3,
  Search,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  FileText,
  Building2,
  Package,
  Layers,
  ArrowRight,
  Filter,
  Minus,
  Plus,
  Sparkles,
  Info,
  Clock,
} from "lucide-react";

interface CountItemState {
  counted: number;
  notes: string;
  isModified: boolean;
}

export default function InventairePhysiquePage() {
  const { showToast } = useToast();
  const { shopId, shopName, shops, setActiveShopId } = useDashboardShop();

  // Données
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Saisie de comptage : clé = productId
  const [counts, setCounts] = useState<Record<string, CountItemState>>({});
  const [sessionNotes, setSessionNotes] = useState("");

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "discrepancies" | "deficit" | "surplus" | "match">("all");

  // Modales
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<AdjustDiscrepanciesResponse | null>(null);

  // Historique des ajustements
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<AdjustmentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Chargement des catégories ──
  useEffect(() => {
    CategoryService.getAll()
      .then((res) => {
        const list = res.data && Array.isArray(res.data) ? res.data : [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  // ── Chargement des produits pour la boutique active ──
  const loadProducts = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await ProductService.getAll({ shopId, limit: 200 });
      const list: Product[] = Array.isArray(res) ? res : res.data || [];
      setProducts(list);

      // Initialiser la grille de comptage avec le stock théorique actuel
      const initialCounts: Record<string, CountItemState> = {};
      list.forEach((p) => {
        initialCounts[p.id] = {
          counted: p.stockQty ?? 0,
          notes: "",
          isModified: false,
        };
      });
      setCounts(initialCounts);
    } catch {
      showToast("Erreur lors du chargement des produits pour l'inventaire", "error");
    } finally {
      setLoading(false);
    }
  }, [shopId, showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ── Chargement de l'historique ──
  const loadHistory = async () => {
    if (!shopId) return;
    setLoadingHistory(true);
    try {
      const history = await InventoryService.getAdjustmentHistory(shopId, 50);
      setHistoryItems(history);
      setIsHistoryModalOpen(true);
    } catch {
      showToast("Impossible de charger l'historique des ajustements", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Manipulation des valeurs de comptage ──
  const handleCountChange = (productId: string, value: number) => {
    const validVal = isNaN(value) ? 0 : Math.max(0, value);
    const originalStock = products.find((p) => p.id === productId)?.stockQty ?? 0;
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        counted: validVal,
        isModified: validVal !== originalStock,
      },
    }));
  };

  const handleNotesChange = (productId: string, notes: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        notes,
      },
    }));
  };

  const handleQuickMatch = (productId: string) => {
    const originalStock = products.find((p) => p.id === productId)?.stockQty ?? 0;
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        counted: originalStock,
        isModified: false,
      },
    }));
  };

  const handleQuickZero = (productId: string) => {
    const originalStock = products.find((p) => p.id === productId)?.stockQty ?? 0;
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        counted: 0,
        isModified: originalStock !== 0,
      },
    }));
  };

  // ── Statistiques et calculs en temps réel ──
  const calculatedItems = useMemo(() => {
    return products.map((p) => {
      const currentCount = counts[p.id]?.counted ?? p.stockQty;
      const discrepancy = currentCount - p.stockQty;
      const buyingPrice = Number(p.buyingPrice || 0);
      const discrepancyValue = discrepancy * buyingPrice;
      const notes = counts[p.id]?.notes || "";
      const isModified = counts[p.id]?.isModified ?? false;

      let status: "MATCH" | "DEFICIT" | "SURPLUS" = "MATCH";
      if (discrepancy < 0) status = "DEFICIT";
      if (discrepancy > 0) status = "SURPLUS";

      return {
        product: p,
        theoreticalStock: p.stockQty,
        countedQuantity: currentCount,
        discrepancy,
        discrepancyValue,
        notes,
        isModified,
        status,
      };
    });
  }, [products, counts]);

  // KPIs globaux
  const kpis = useMemo(() => {
    let deficitCount = 0;
    let deficitQty = 0;
    let deficitValue = 0;

    let surplusCount = 0;
    let surplusQty = 0;
    let surplusValue = 0;

    let modifiedCount = 0;

    calculatedItems.forEach((item) => {
      if (item.status === "DEFICIT") {
        deficitCount++;
        deficitQty += Math.abs(item.discrepancy);
        deficitValue += Math.abs(item.discrepancyValue);
      } else if (item.status === "SURPLUS") {
        surplusCount++;
        surplusQty += item.discrepancy;
        surplusValue += item.discrepancyValue;
      }
      if (item.isModified) modifiedCount++;
    });

    const netValue = surplusValue - deficitValue;

    return {
      totalProducts: products.length,
      modifiedCount,
      deficitCount,
      deficitQty,
      deficitValue,
      surplusCount,
      surplusQty,
      surplusValue,
      netValue,
    };
  }, [calculatedItems, products.length]);

  // Filtrage des articles pour la vue
  const filteredItems = useMemo(() => {
    return calculatedItems.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.product.name.toLowerCase().includes(term) ||
        (item.product.barcode && item.product.barcode.includes(term)) ||
        (item.product.sku && item.product.sku.toLowerCase().includes(term));

      const matchCategory = !selectedCategory || item.product.categoryId === selectedCategory;

      let matchStatus = true;
      if (statusFilter === "discrepancies") matchStatus = item.status !== "MATCH";
      if (statusFilter === "deficit") matchStatus = item.status === "DEFICIT";
      if (statusFilter === "surplus") matchStatus = item.status === "SURPLUS";
      if (statusFilter === "match") matchStatus = item.status === "MATCH";

      return matchSearch && matchCategory && matchStatus;
    });
  }, [calculatedItems, searchTerm, selectedCategory, statusFilter]);

  // Liste des articles avec écart pour la soumission
  const itemsToAdjust = useMemo(() => {
    return calculatedItems
      .filter((i) => i.isModified || i.discrepancy !== 0)
      .map((i) => ({
        productId: i.product.id,
        countedQuantity: i.countedQuantity,
        notes: i.notes || undefined,
      }));
  }, [calculatedItems]);

  // ── Soumission Atomique de la Régularisation ──
  const handleConfirmAdjust = async () => {
    if (!shopId) {
      showToast("Veuillez sélectionner une boutique", "error");
      return;
    }

    if (itemsToAdjust.length === 0) {
      showToast("Aucun écart à régulariser : tous les stocks sont conformes", "info");
      setIsConfirmModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await InventoryService.adjustDiscrepancies({
        shopId,
        notes: sessionNotes.trim() || `Inventaire physique régularisé le ${new Date().toLocaleDateString("fr-FR")}`,
        items: itemsToAdjust,
      });

      setResultSummary(response);
      showToast(
        `Inventaire régularisé avec succès (${response.adjustedCount} article(s) mis à jour)`,
        "success"
      );
      setIsConfirmModalOpen(false);
      // Recharger les stocks à jour depuis le backend
      loadProducts();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Erreur lors de la régularisation des stocks";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <AppLayout
      title="Inventaire Physique & Régularisation"
      subtitle="Saisie de comptage en rayon et régularisation atomique des écarts"
    >
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 md:pb-12">
        {/* ── Navigation Secondaire Inventaire ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            Tableau de Bord & Valorisation
          </Link>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm shadow-primary/20">
            <ClipboardCheck className="h-4 w-4" />
            Inventaire Physique (Comptage & Régularisation)
          </div>
          <Link
            href="/admin/inventory/perimes"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <AlertCircle className="h-4 w-4" />
            Alertes DLC & Rapport des Pertes
          </Link>
        </div>

        {/* ── Entête & Actions Clés ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">
                Session d&apos;Inventaire Physique
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Boutique active : <span className="font-bold text-foreground">{shopName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="rounded-xl h-10 px-3.5"
            >
              <History className={`h-4 w-4 mr-2 ${loadingHistory ? "animate-spin" : ""}`} />
              Historique des Régularisations
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl h-10 px-3.5"
              title="Réinitialiser la feuille"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={loading || itemsToAdjust.length === 0}
              className="rounded-xl h-10 px-4 font-black shadow-md shadow-primary/20"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Régulariser ({itemsToAdjust.length} écarts)
            </Button>
          </div>
        </div>

        {/* ── KPI Cards Temps Réel ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Articles dans le Magasin
              </span>
              <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-foreground">{kpis.totalProducts}</span>
              <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
                {kpis.modifiedCount} comptage(s) modifié(s)
              </p>
            </div>
          </Card>

          <Card className="p-4.5 rounded-2xl border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                Écarts en Déficit (Pertes)
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-rose-600">
                -{kpis.deficitQty} <span className="text-sm font-bold">unités</span>
              </span>
              <p className="text-[11px] font-black text-rose-500 mt-0.5">
                -{fmtCurrency(kpis.deficitValue)} ({kpis.deficitCount} articles)
              </p>
            </div>
          </Card>

          <Card className="p-4.5 rounded-2xl border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Écarts en Surplus
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-emerald-600">
                +{kpis.surplusQty} <span className="text-sm font-bold">unités</span>
              </span>
              <p className="text-[11px] font-black text-emerald-500 mt-0.5">
                +{fmtCurrency(kpis.surplusValue)} ({kpis.surplusCount} articles)
              </p>
            </div>
          </Card>

          <Card
            className={`p-4.5 rounded-2xl border ${
              kpis.netValue < 0
                ? "border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Impact Financier Net
              </span>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  kpis.netValue < 0
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span
                className={`text-2xl font-black ${
                  kpis.netValue < 0
                    ? "text-rose-600"
                    : kpis.netValue > 0
                    ? "text-emerald-600"
                    : "text-foreground"
                }`}
              >
                {fmtCurrency(kpis.netValue)}
              </span>
              <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                Surplus net - Déficit net
              </p>
            </div>
          </Card>
        </div>

        {/* ── Barre de Filtres & Recherche ── */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code-barres ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Filtre Catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary transition-all"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filtre Statut d'Écart */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tous ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("discrepancies")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "discrepancies"
                    ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Écarts ({kpis.deficitCount + kpis.surplusCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("deficit")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "deficit"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-rose-600 hover:text-rose-700"
                }`}
              >
                Déficits ({kpis.deficitCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("surplus")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "surplus"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                Surplus ({kpis.surplusCount})
              </button>
            </div>
          </div>
        </div>

        {/* ── Grille Interactive de Comptage ── */}
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4 text-center">Stock Théorique</th>
                  <th className="py-3 px-4 text-center">Comptage Physique</th>
                  <th className="py-3 px-4 text-center">Écart</th>
                  <th className="py-3 px-4 text-right">Impact Valeur</th>
                  <th className="py-3 px-4">Remarques / Motif</th>
                  <th className="py-3 px-4 text-center">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span>Chargement des articles de la boutique...</span>
                      </div>
                    </td>
                  </tr>
                ) : !shopId ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="h-6 w-6 text-zinc-400" />
                        <span>Veuillez sélectionner une boutique dans la barre supérieure pour démarrer l&apos;inventaire</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground font-bold">
                      Aucun produit ne correspond à ces critères
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const p = item.product;
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          item.status === "DEFICIT"
                            ? "bg-rose-50/30 dark:bg-rose-950/10"
                            : item.status === "SURPLUS"
                            ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        }`}
                      >
                        {/* Produit */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-black text-foreground">{p.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.barcode && (
                                <span className="text-[10px] font-bold text-zinc-400">
                                  {p.barcode}
                                </span>
                              )}
                              {p.sku && (
                                <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded">
                                  {p.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Stock Théorique */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-black text-foreground">
                            {item.theoreticalStock}
                          </span>
                        </td>

                        {/* Comptage Physique (Input + Steppers) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 rounded-xl shadow-inner">
                            <button
                              type="button"
                              onClick={() => handleCountChange(p.id, item.countedQuantity - 1)}
                              className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center font-black text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.countedQuantity}
                              onChange={(e) => handleCountChange(p.id, parseFloat(e.target.value))}
                              onFocus={(e) => e.target.select()}
                              className="w-16 text-center font-black text-sm bg-transparent outline-none text-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => handleCountChange(p.id, item.countedQuantity + 1)}
                              className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center font-black text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Écart Constaté */}
                        <td className="py-3 px-4 text-center">
                          {item.status === "DEFICIT" ? (
                            <Badge variant="danger" className="font-black px-2 py-0.5">
                              Déficit ({item.discrepancy})
                            </Badge>
                          ) : item.status === "SURPLUS" ? (
                            <Badge variant="success" className="font-black px-2 py-0.5">
                              Surplus (+{item.discrepancy})
                            </Badge>
                          ) : (
                            <span className="text-[11px] font-bold text-zinc-400">Conforme (0)</span>
                          )}
                        </td>

                        {/* Impact Financier */}
                        <td className="py-3 px-4 text-right font-black">
                          {item.discrepancyValue !== 0 ? (
                            <span
                              className={item.discrepancyValue < 0 ? "text-rose-600" : "text-emerald-600"}
                            >
                              {fmtCurrency(item.discrepancyValue)}
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Notes / Remarques */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Ex: 2 abîmés, vol suspecté..."
                            value={item.notes}
                            onChange={(e) => handleNotesChange(p.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                          />
                        </td>

                        {/* Actions Rapides */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickMatch(p.id)}
                              title="Réaligner sur le stock théorique"
                              className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              = Match
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickZero(p.id)}
                              title="Déclarer rupture totale (0)"
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-[10px] font-bold text-rose-600 transition-colors"
                            >
                              = 0
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Modale de Confirmation de Régularisation ── */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Validation Atomique de l'Inventaire"
          size="lg"
        >
          <div className="flex flex-col gap-5 p-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p>
                Cette opération va <strong>ajuster définitivement les stocks informatiques</strong> de la
                boutique pour refléter votre comptage physique en rayon. Les mouvements d&apos;ajustement
                seront journalisés.
              </p>
            </div>

            {/* Résumé de l'opération */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Articles ajustés</span>
                <p className="text-lg font-black text-foreground">{itemsToAdjust.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <span className="text-[10px] uppercase font-bold text-rose-600">Pertes constatées</span>
                <p className="text-lg font-black text-rose-600">-{fmtCurrency(kpis.deficitValue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Surplus constatés</span>
                <p className="text-lg font-black text-emerald-600">+{fmtCurrency(kpis.surplusValue)}</p>
              </div>
            </div>

            {/* Note globale de session */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Notes de session / Motif général
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Inventaire général de fin de mois, comptage physique complet..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Aperçu des articles à ajuster */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {calculatedItems
                .filter((i) => i.isModified || i.discrepancy !== 0)
                .map((i) => (
                  <div key={i.product.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground">{i.product.name}</span>
                      <p className="text-[10px] text-muted-foreground">
                        Avant: {i.theoreticalStock} ➔ Nouveau: {i.countedQuantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black ${
                          i.status === "DEFICIT"
                            ? "text-rose-600"
                            : i.status === "SURPLUS"
                            ? "text-emerald-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {i.discrepancy > 0 ? `+${i.discrepancy}` : i.discrepancy} ({fmtCurrency(i.discrepancyValue)})
                      </span>
                      {i.notes && <p className="text-[10px] text-zinc-400 italic">{i.notes}</p>}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAdjust}
                disabled={isSubmitting}
                className="font-black px-4 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Application en cours...</span>
                  </div>
                ) : (
                  <span>Confirmer & Enregistrer</span>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── Modale Historique des Ajustements ── */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title="Historique des Ajustements d'Inventaire"
          size="lg"
        >
          <div className="flex flex-col gap-4 p-2 max-h-[70vh] overflow-y-auto">
            {historyItems.length === 0 ? (
              <div className="text-center py-10 text-xs font-bold text-muted-foreground">
                Aucun ajustement d&apos;inventaire enregistré pour cette boutique
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {historyItems.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">
                        {h.product?.name || `Produit #${h.productId.slice(0, 8)}`}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(h.createdAt).toLocaleString("fr-FR")}</span>
                        {h.reason && <span className="uppercase font-bold">({h.reason})</span>}
                      </div>
                      {h.notes && <p className="text-[11px] text-zinc-500 italic mt-0.5">{h.notes}</p>}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[11px] font-bold text-zinc-400">
                          {h.previousStock} ➔ {h.newStock}
                        </span>
                        <Badge
                          variant={h.quantity < 0 ? "danger" : "success"}
                          className="font-black text-[10px]"
                        >
                          {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
