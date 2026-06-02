"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/contexts/ToastContext";
import ProductService, { Product } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Package,
  Tag,
  AlertTriangle,
  Barcode,
  Layers,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

/**
 * Page de visualisation des stocks pour la caissière / gérant de boutique
 * Version synchronisée avec le backend
 */
export default function SuperProduitsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // États pour la pagination et recherche debouncée
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Effet de debounce pour la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Réinitialiser la page courante si le terme de recherche ou la catégorie change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Chargement des filtres / catégories statiques
  const loadStaticData = async () => {
    if (!user?.shopId) return;
    try {
      const catRes = await CategoryService.getAll({ shopId: user.shopId });
      const catList = catRes?.data && Array.isArray(catRes.data) ? catRes.data : (Array.isArray(catRes) ? catRes : []);
      setCategories(catList);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement des catégories", "error");
    }
  };

  // Chargement des produits paginés et filtrés
  const loadProducts = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const params: any = {
        shopId: user.shopId,
        page,
        limit,
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const prodRes = await ProductService.getAll(params);
      const prodList = prodRes?.data && Array.isArray(prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);

      setProducts(prodList);
      setTotalPages(prodRes?.totalPages ?? 1);
      setTotalProducts(prodRes?.total ?? prodList.length);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement des produits", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => {
    loadProducts();
  };

  useEffect(() => {
    loadStaticData();
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [user, page, limit, debouncedSearch, selectedCategory]);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-zinc-400">
            ...
          </span>
        );
      }

      const isCurrent = p === page;
      return (
        <button
          key={`page-${p}`}
          type="button"
          onClick={() => setPage(p as number)}
          className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-black transition-all ${
            isCurrent
              ? "bg-primary text-white shadow-sm shadow-primary/30"
              : "border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  const columns: { header: string; accessor: keyof Product | ((item: Product) => React.ReactNode); className?: string }[] = [
    {
      header: "Code-barres",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <Barcode className="h-4 w-4 text-zinc-400" />
          <span className="font-mono text-[11px] font-bold text-zinc-500">{p.barcode || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Produit",
      accessor: (p: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{p.name}</span>
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter">
            {p.category?.name || "Général"}
          </span>
        </div>
      ),
    },
    {
      header: "Prix Vente",
      accessor: (p: Product) => (
        <span className="text-primary font-black">
          {new Intl.NumberFormat('fr-FR').format(p.sellingPrice)} XOF
        </span>
      ),
    },
    {
      header: "Stock Disponible",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-black ${p.stockQty <= p.minStockQty ? "text-red-600" : "text-emerald-600"}`}>
            {p.stockQty}
          </span>
          {p.stockQty <= p.minStockQty && (
            <Badge variant="danger" className="animate-pulse">
              Critique
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (p: Product) => (
        <Badge variant={p.isActive ? "success" : "outline"}>
          {p.isActive ? "En vente" : "Retiré"}
        </Badge>
      )
    }
  ];

  return (
    <AppLayout
      title="Gestion des Stocks"
      subtitle="Visualisation en temps réel de votre inventaire boutique"
      rightElement={
        <button 
          onClick={loadData}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-24 md:pb-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Articles</p>
              <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{totalProducts}</h4>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-red-500/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Alertes Stock</p>
              <h4 className="text-2xl font-black text-red-600">
                {products.filter((p) => p.stockQty <= p.minStockQty).length}
              </h4>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valeur Stock</p>
              <h4 className="text-2xl font-black text-emerald-600">
                {new Intl.NumberFormat('fr-FR').format(products.reduce((acc, p) => acc + (p.stockQty * p.buyingPrice), 0))}
              </h4>
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <Card className="p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${!selectedCategory ? "bg-primary text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <DataTable columns={columns} data={products} isLoading={loading} />

          {/* Section Pagination Moderne & Premium */}
          {!loading && products.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-4 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                <span>Affichage de</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {Math.min((page - 1) * limit + 1, totalProducts)}
                </span>
                <span>à</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {Math.min(page * limit, totalProducts)}
                </span>
                <span>sur</span>
                <span className="text-primary font-black">{totalProducts}</span>
                <span>articles</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Sélecteur de taille de page */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Taille :</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-primary transition-colors"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Boutons de navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {renderPageNumbers()}

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
