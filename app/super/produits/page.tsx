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
  RefreshCw
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        ProductService.getAll({ shopId: user?.shopId, limit: 1000 }), // Uniquement les produits de sa boutique
        CategoryService.getAll({ limit: 100 })
      ]);
      
      const prodList = prodRes?.data && Array.isArray(prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
      const catList = catRes?.data && Array.isArray(catRes.data) ? catRes.data : (Array.isArray(catRes) ? catRes : []);
      
      setProducts(prodList);
      setCategories(catList);
    } catch (error) {
      showToast("Erreur lors du chargement des stocks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.shopId) loadData();
  }, [user]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Articles</p>
              <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{products.length}</h4>
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

          <DataTable columns={columns} data={filteredProducts} isLoading={loading} />
        </Card>
      </div>
    </AppLayout>
  );
}
