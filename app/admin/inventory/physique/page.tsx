"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { BarcodeScannerModal } from "@/components/ui/BarcodeScannerModal";
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
  Building2,
  Package,
  Minus,
  Plus,
  Sparkles,
  Clock,
  Camera,
  X,
} from "lucide-react";

interface CountItemState {
  counted: number;
  notes: string;
  isModified: boolean;
}

export default function InventairePhysiquePage() {
  const { showToast } = useToast();
  const { shopId, shopName } = useDashboardShop();

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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "discrepancies" | "deficit" | "surplus" | "match"
  >("all");

  // Scanner de code-barres
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Modales
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setResultSummary] = useState<AdjustDiscrepanciesResponse | null>(null);

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

    let matchCount = 0;
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
      } else {
        matchCount++;
      }
      if (item.isModified) modifiedCount++;
    });

    const netValue = surplusValue - deficitValue;

    return {
      totalProducts: products.length,
      modifiedCount,
      matchCount,
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
        notes:
          sessionNotes.trim() ||
          `Inventaire physique régularisé le ${new Date().toLocaleDateString("fr-FR")}`,
        items: itemsToAdjust,
      });

      setResultSummary(response);
      const count = response?.adjustedCount ?? itemsToAdjust.length;
      showToast(
        `Inventaire régularisé avec succès (${count} article(s) mis à jour)`,
        "success"
      );
      setIsConfirmModalOpen(false);
      loadProducts();
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || err?.message || "Erreur lors de la régularisation des stocks";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <AppLayout
      title="Inventaire Physique"
      subtitle="Saisie de comptage en rayon et régularisation atomique des écarts"
    >
      <div className="flex flex-col gap-4 sm:gap-6 w-full pb-24 md:pb-12">
        {/* ── Navigation Secondaire Inventaire (Scrollable sur mobile) ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0 whitespace-nowrap"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>Tableau de Bord</span>
          </Link>
          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm shadow-primary/20 shrink-0 whitespace-nowrap">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span>Inventaire Physique</span>
          </div>
          <Link
            href="/admin/inventory/perimes"
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0 whitespace-nowrap"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Alertes DLC & Pertes</span>
          </Link>
        </div>

        {/* ── Entête & Actions Clés (Optimisé Mobile) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                Session d&apos;Inventaire Physique
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                Boutique : <span className="font-bold text-foreground">{shopName || "Non sélectionnée"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="rounded-xl h-9 sm:h-10 px-3 text-xs flex-1 sm:flex-none justify-center"
            >
              <History className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 ${loadingHistory ? "animate-spin" : ""}`} />
              <span>Historique</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl h-9 sm:h-10 px-3"
              title="Réinitialiser la feuille"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={loading || itemsToAdjust.length === 0}
              className="rounded-xl h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-black shadow-md shadow-primary/20 flex-1 sm:flex-none justify-center whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              <span>Régulariser ({itemsToAdjust.length})</span>
            </Button>
          </div>
        </div>

        {/* ── KPI Cards Temps Réel (Grille 2x2 compacte sur mobile) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Articles Magasin */}
          <Card className="p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground truncate">
                Articles Magasin
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {kpis.totalProducts}
              </span>
              <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 mt-0.5 truncate">
                {kpis.modifiedCount} modifié(s)
              </p>
            </div>
          </Card>

          {/* Card 2: Écarts en Déficit */}
          <Card className="p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-rose-600 truncate">
                Pertes Déficits
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-rose-600">
                  -{kpis.deficitQty}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-rose-500">unités</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-black text-rose-500 mt-0.5 truncate">
                -{fmtCurrency(kpis.deficitValue)} ({kpis.deficitCount} art.)
              </p>
            </div>
          </Card>

          {/* Card 3: Écarts en Surplus */}
          <Card className="p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-600 truncate">
                Écarts Surplus
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  +{kpis.surplusQty}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-500">unités</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-black text-emerald-500 mt-0.5 truncate">
                +{fmtCurrency(kpis.surplusValue)} ({kpis.surplusCount} art.)
              </p>
            </div>
          </Card>

          {/* Card 4: Impact Financier Net */}
          <Card
            className={`p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border ${
              kpis.netValue < 0
                ? "border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground truncate">
                Impact Financier Net
              </span>
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  kpis.netValue < 0
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span
                className={`text-xl sm:text-2xl font-black truncate block ${
                  kpis.netValue < 0
                    ? "text-rose-600"
                    : kpis.netValue > 0
                    ? "text-emerald-600"
                    : "text-foreground"
                }`}
              >
                {fmtCurrency(kpis.netValue)}
              </span>
              <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-0.5 truncate">
                Surplus net - Pertes
              </p>
            </div>
          </Card>
        </div>

        {/* ── Barre de Filtres & Recherche Ergonomique ── */}
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
          {/* Ligne Recherche + Scanner Caméra + Select Catégorie */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Input Recherche avec Scan et Clear */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par nom, code-barres ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all placeholder:text-zinc-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
                    title="Effacer la recherche"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                  title="Scanner un code-barres avec la caméra"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filtre Catégorie */}
            <div className="sm:w-56 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary transition-all"
              >
                <option value="">Toutes les catégories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pilules de Statut Déroulantes Horizontalement sur Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Tous</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-white/20">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("discrepancies")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "discrepancies"
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100"
              }`}
            >
              <span>Écarts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">
                {kpis.deficitCount + kpis.surplusCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("deficit")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "deficit"
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
              }`}
            >
              <span>Déficits</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">
                {kpis.deficitCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("surplus")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "surplus"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
              }`}
            >
              <span>Surplus</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">
                {kpis.surplusCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("match")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "match"
                  ? "bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Conformes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {kpis.matchCount}
              </span>
            </button>
          </div>
        </div>

        {/* ── VUE MOBILE DÉDIÉE (Cartes tactiles ergonomiques) ── */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground font-bold">
              <div className="flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span>Chargement des articles de la boutique...</span>
              </div>
            </Card>
          ) : !shopId ? (
            <Card className="p-8 text-center text-muted-foreground font-bold">
              <div className="flex flex-col items-center justify-center gap-2">
                <Building2 className="h-6 w-6 text-zinc-400" />
                <span>Veuillez sélectionner une boutique dans la barre supérieure</span>
              </div>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground font-bold">
              Aucun produit ne correspond à ces critères
            </Card>
          ) : (
            filteredItems.map((item) => {
              const p = item.product;
              const isDeficit = item.status === "DEFICIT";
              const isSurplus = item.status === "SURPLUS";

              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border transition-all shadow-sm ${
                    isDeficit
                      ? "border-l-4 border-l-rose-500 border-zinc-200 dark:border-zinc-800 bg-rose-50/15 dark:bg-rose-950/10"
                      : isSurplus
                      ? "border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800 bg-emerald-50/15 dark:bg-emerald-950/10"
                      : "border-zinc-200/80 dark:border-zinc-800"
                  }`}
                >
                  {/* Header de la carte : Nom + Badges + Statut */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-foreground leading-tight">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.sku && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {p.sku}
                          </span>
                        )}
                        {p.barcode && (
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                            {p.barcode}
                          </span>
                        )}
                        {item.isModified && (
                          <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-md">
                            Modifié
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Statut Écart Badge */}
                    <div className="shrink-0 text-right">
                      {isDeficit ? (
                        <Badge variant="danger" className="font-black text-[11px] px-2 py-0.5">
                          Déficit ({item.discrepancy})
                        </Badge>
                      ) : isSurplus ? (
                        <Badge variant="success" className="font-black text-[11px] px-2 py-0.5">
                          Surplus (+{item.discrepancy})
                        </Badge>
                      ) : (
                        <span className="inline-block text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          Conforme (0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grille de Comptage Mobile : Théorique vs Stepper Physique */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                    {/* Colonne Stock Théorique */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Théorique
                      </span>
                      <span className="text-base font-black text-foreground mt-0.5">
                        {item.theoreticalStock}
                      </span>
                      {item.discrepancyValue !== 0 && (
                        <span
                          className={`text-[10px] font-black mt-0.5 ${
                            isDeficit ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {fmtCurrency(item.discrepancyValue)}
                        </span>
                      )}
                    </div>

                    {/* Stepper tactile pour le comptage physique */}
                    <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 p-1 rounded-2xl shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleCountChange(p.id, item.countedQuantity - 1)}
                        className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 active:scale-95 flex items-center justify-center font-black text-zinc-700 dark:text-zinc-200 shadow-xs transition-transform"
                        aria-label="Diminuer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          value={item.countedQuantity}
                          onChange={(e) => handleCountChange(p.id, parseFloat(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="w-16 h-10 text-center font-black text-lg bg-transparent outline-none text-foreground"
                        />
                        <span className="text-[9px] font-bold text-muted-foreground -mt-1">
                          compté
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCountChange(p.id, item.countedQuantity + 1)}
                        className="h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-95 flex items-center justify-center font-black shadow-xs transition-transform"
                        aria-label="Augmenter"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Rapides & Remarques */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickMatch(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                        >
                          = Match ({item.theoreticalStock})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickZero(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-[11px] font-bold text-rose-600 transition-colors"
                        >
                          = 0 (Rupture)
                        </button>
                      </div>

                      {item.discrepancy !== 0 && (
                        <span className="text-[11px] font-black text-muted-foreground">
                          Écart :{" "}
                          <span
                            className={
                              isDeficit ? "text-rose-600 font-black" : "text-emerald-600 font-black"
                            }
                          >
                            {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Champ Remarque / Motif */}
                    <input
                      type="text"
                      placeholder="Remarque (ex: abîmé, vol, erreur réception...)"
                      value={item.notes}
                      onChange={(e) => handleNotesChange(p.id, e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-primary transition-colors placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── VUE DESKTOP TABLEAU (Pour écrans md et supérieurs) ── */}
        <Card className="hidden md:block overflow-hidden border-none shadow-xl">
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
                        <span>
                          Veuillez sélectionner une boutique dans la barre supérieure pour démarrer
                          l&apos;inventaire
                        </span>
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
                              onChange={(e) =>
                                handleCountChange(p.id, parseFloat(e.target.value))
                              }
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
                            <span className="text-[11px] font-bold text-zinc-400">
                              Conforme (0)
                            </span>
                          )}
                        </td>

                        {/* Impact Financier */}
                        <td className="py-3 px-4 text-right font-black">
                          {item.discrepancyValue !== 0 ? (
                            <span
                              className={
                                item.discrepancyValue < 0 ? "text-rose-600" : "text-emerald-600"
                              }
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

        {/* ── Barre Flottante Mobile de Régularisation Rapide ── */}
        {itemsToAdjust.length > 0 && (
          <div className="fixed bottom-[74px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-zinc-900/95 dark:bg-zinc-850/95 text-white backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-zinc-700/60 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-xs font-black truncate">
                  {itemsToAdjust.length} écart(s) à régulariser
                </span>
              </div>
              <span className="text-[11px] font-bold text-zinc-300 mt-0.5 truncate">
                Net :{" "}
                <span
                  className={
                    kpis.netValue < 0
                      ? "text-rose-400 font-black"
                      : "text-emerald-400 font-black"
                  }
                >
                  {fmtCurrency(kpis.netValue)}
                </span>
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={loading || isSubmitting}
              className="rounded-xl h-10 px-4 font-black shadow-lg shadow-primary/30 shrink-0 text-xs"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Régulariser</span>
            </Button>
          </div>
        )}

        {/* ── Modale Scanner Code-Barres ── */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            setSearchTerm(code);
            setIsScannerOpen(false);
            showToast(`Code scanné : ${code}`, "info");
          }}
          title="Scanner de Rayon"
          subtitle="Visez le code-barres du produit pour le retrouver directement"
        />

        {/* ── Modale de Confirmation de Régularisation ── */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Validation Atomique de l'Inventaire"
          size="lg"
        >
          <div className="flex flex-col gap-4 sm:gap-5 p-1 sm:p-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <p>
                Cette opération va <strong>ajuster définitivement les stocks informatiques</strong> de la
                boutique pour refléter votre comptage physique en rayon. Les mouvements d&apos;ajustement
                seront journalisés.
              </p>
            </div>

            {/* Résumé de l'opération */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground block truncate">
                  Articles ajustés
                </span>
                <p className="text-base sm:text-lg font-black text-foreground mt-0.5">
                  {itemsToAdjust.length}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-600 block truncate">
                  Pertes
                </span>
                <p className="text-base sm:text-lg font-black text-rose-600 mt-0.5">
                  -{fmtCurrency(kpis.deficitValue)}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-600 block truncate">
                  Surplus
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                  +{fmtCurrency(kpis.surplusValue)}
                </p>
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
                  <div
                    key={i.product.id}
                    className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-foreground block truncate">
                        {i.product.name}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        Avant : {i.theoreticalStock} ➔ Nouveau : {i.countedQuantity}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span
                        className={`font-black ${
                          i.status === "DEFICIT"
                            ? "text-rose-600"
                            : i.status === "SURPLUS"
                            ? "text-emerald-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {i.discrepancy > 0 ? `+${i.discrepancy}` : i.discrepancy} (
                        {fmtCurrency(i.discrepancyValue)})
                      </span>
                      {i.notes && <p className="text-[10px] text-zinc-400 italic">{i.notes}</p>}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl h-10 justify-center"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAdjust}
                disabled={isSubmitting}
                className="font-black px-4 shadow-lg shadow-primary/20 rounded-xl h-10 justify-center"
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
          <div className="flex flex-col gap-3 p-1 sm:p-2 max-h-[70vh] overflow-y-auto">
            {historyItems.length === 0 ? (
              <div className="text-center py-10 text-xs font-bold text-muted-foreground">
                Aucun ajustement d&apos;inventaire enregistré pour cette boutique
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {historyItems.map((h) => (
                  <div
                    key={h.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground truncate">
                        {h.product?.name || `Produit #${h.productId.slice(0, 8)}`}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{new Date(h.createdAt).toLocaleString("fr-FR")}</span>
                        {h.reason && (
                          <span className="uppercase font-bold text-zinc-500">
                            ({h.reason})
                          </span>
                        )}
                      </div>
                      {h.notes && (
                        <p className="text-[11px] text-zinc-500 italic mt-0.5">{h.notes}</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-center gap-1.5 sm:justify-end">
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

