/**
 * ============================================================================
 * PAGE : INVENTAIRE SUPERETTE
 * ============================================================================
 * 
 * Affiche tous les produits de la boutique avec leurs stocks réels,
 * les seuils critiques, et permet de rechercher/filtrer.
 * 
 * Connecté au backend via :
 *   - ProductService.getAll({ shopId }) → Liste des produits avec stocks
 *   - CategoryService.getAll() → Catégories pour le filtre
 * 
 * @see back-spservice/src/modules/product
 * ============================================================================
 */
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import ProductService from "@/services/product.service";
import CategoryService from "@/services/category.service";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Filter,
} from "lucide-react";

/**
 * Interface locale pour les produits affichés dans l'inventaire.
 * Correspond aux champs retournés par GET /products?shopId=xxx
 */
interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  sellingPrice: number;
  costPrice?: number;
  stockQty: number;
  minStockQty: number;
  unit?: string;
  categoryId?: string;
  category?: { id: string; name: string };
}

export default function SuperInventairePage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  // === État du composant ===
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  /**
   * Charge tous les produits de la boutique du manager connecté.
   * Le backend supporte la pagination mais on charge tout pour l'inventaire.
   */
  const loadData = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      // Chargement parallèle : produits + catégories
      const [prodRes, catRes] = await Promise.all([
        ProductService.getAll({ shopId: user.shopId }),
        CategoryService.getAll({ shopId: user.shopId }),
      ]);

      // Extraction robuste — le backend peut renvoyer un tableau direct ou un objet paginé
      const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);
      const catList = Array.isArray(catRes) ? catRes : (catRes?.data || []);

      setProducts(prodList);
      setCategories(catList);
    } catch (error) {
      showToast("Erreur lors du chargement de l'inventaire", "error");
    } finally {
      setLoading(false);
    }
  };

  // Chargement au montage et quand l'utilisateur change
  useEffect(() => {
    loadData();
  }, [user]);

  // === Filtrage côté client ===
  const filteredProducts = products.filter((p) => {
    // Filtre de recherche textuelle (nom, SKU, code-barres)
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (p.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false);

    // Filtre par catégorie
    const matchesCategory =
      categoryFilter === "ALL" || p.categoryId === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // === KPIs calculés à partir des données réelles ===
  const totalProducts = products.length;
  const criticalProducts = products.filter((p) => p.stockQty <= p.minStockQty);
  const outOfStock = products.filter((p) => p.stockQty === 0);
  const stockValue = products.reduce(
    (acc, p) => acc + p.stockQty * (p.costPrice || p.sellingPrice),
    0
  );

  // === Colonnes du tableau ===
  const columns: {
    header: string;
    accessor: (item: InventoryProduct) => React.ReactNode;
    className?: string;
  }[] = [
    {
      header: "Produit",
      accessor: (p: InventoryProduct) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
            {p.name}
          </span>
          <div className="flex items-center gap-2">
            {/* Afficher le SKU si disponible */}
            {p.sku && (
              <span className="text-[10px] text-zinc-400 font-bold">
                SKU: {p.sku}
              </span>
            )}
            {/* Afficher la catégorie si disponible */}
            {p.category && (
              <span className="text-[10px] text-primary/70 font-bold uppercase">
                {p.category.name}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Stock",
      accessor: (p: InventoryProduct) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-black ${
              p.stockQty === 0
                ? "text-red-600"
                : p.stockQty <= p.minStockQty
                ? "text-amber-600"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {p.stockQty}
          </span>
          {p.unit && (
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              {p.unit}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Seuil Min.",
      accessor: (p: InventoryProduct) => (
        <span className="text-xs font-bold text-zinc-500">{p.minStockQty}</span>
      ),
    },
    {
      header: "Statut",
      accessor: (p: InventoryProduct) => {
        // Logique de statut basée sur le stock vs seuil minimum
        if (p.stockQty === 0) {
          return (
            <Badge variant="danger" className="text-[9px]">
              RUPTURE
            </Badge>
          );
        }
        if (p.stockQty <= p.minStockQty) {
          return (
            <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">
              CRITIQUE
            </Badge>
          );
        }
        return (
          <Badge variant="success" className="text-[9px]">
            EN STOCK
          </Badge>
        );
      },
    },
    {
      header: "Prix Vente",
      accessor: (p: InventoryProduct) => (
        <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
          {new Intl.NumberFormat("fr-FR").format(p.sellingPrice)} XOF
        </span>
      ),
    },
    {
      header: "Valeur Stock",
      accessor: (p: InventoryProduct) => (
        <span className="text-xs font-bold text-zinc-500">
          {new Intl.NumberFormat("fr-FR").format(
            p.stockQty * (p.costPrice || p.sellingPrice)
          )}{" "}
          XOF
        </span>
      ),
    },
  ];

  return (
    <AppLayout
      title="Inventaire Stock"
      subtitle="État des stocks en temps réel — données du backend"
      rightElement={
        <button
          onClick={loadData}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
        >
          <RefreshCw
            className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* === KPIs en temps réel === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total produits */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Produits
              </p>
            </div>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {totalProducts}
            </h4>
          </div>

          {/* Ruptures */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Ruptures
              </p>
            </div>
            <h4 className="text-2xl font-black text-red-600">
              {outOfStock.length}
            </h4>
          </div>

          {/* Critiques (stock ≤ seuil) */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Critiques
              </p>
            </div>
            <h4 className="text-2xl font-black text-amber-600">
              {criticalProducts.length}
            </h4>
          </div>

          {/* Valeur totale du stock */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Valeur Stock
              </p>
            </div>
            <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              {new Intl.NumberFormat("fr-FR").format(stockValue)} XOF
            </h4>
          </div>
        </div>

        {/* === Tableau d'inventaire === */}
        <Card className="p-0 overflow-hidden shadow-xl border-none">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, SKU ou code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Filtre par catégorie */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 outline-none focus:border-primary transition-all"
              >
                <option value="ALL">Toutes catégories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={loading}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
