"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import SaleService from "@/services/sale.service";
import ProductService from "@/services/product.service";
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Wallet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  History,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

/**
 * Dashboard principal pour le module Supérette
 * Centralise les indicateurs clés de performance (KPI)
 */
export default function SuperDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySalesCount: 0,
    criticalStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      // Charger les ventes pour calculer le CA du jour
      const salesRes = await SaleService.getAll({ shopId: user.shopId });
      const sales = salesRes.data && Array.isArray(salesRes.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);

      const today = new Date().toLocaleDateString();
      const todaySales = sales.filter((s: any) => new Date(s.createdAt).toLocaleDateString() === today);

      const revenue = todaySales.reduce((acc: number, s: any) => acc + (s.totalAmount || s.total || 0), 0);

      // Charger les produits pour les alertes
      const prodRes = await ProductService.getAll({ shopId: user.shopId });
      const prods = prodRes.data && Array.isArray(prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
      const criticalCount = prods.filter((p: any) => p.stockQty <= p.minStockQty).length;

      setStats({
        todayRevenue: revenue,
        todaySalesCount: todaySales.length,
        criticalStockCount: criticalCount
      });
    } catch (error) {
      console.error("Erreur stats dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const modules = [
    {
      title: "Caisse Supérette",
      description: "Interface de vente rapide avec calcul de monnaie automatique.",
      icon: <ShoppingCart className="h-7 w-7 text-primary" />,
      href: "/super/caisse",
      color: "border-l-primary",
    },
    {
      title: "Gestion des Stocks",
      description: "Suivi des arrivages, prix et quantités en rayon.",
      icon: <Package className="h-7 w-7 text-emerald-600" />,
      href: "/super/produits",
      color: "border-l-emerald-500",
    },
    {
      title: "Historique des Ventes",
      description: "Consultez tous les tickets de caisse émis.",
      icon: <FileText className="h-7 w-7 text-zinc-600" />,
      href: "/super/commandes",
      color: "border-l-zinc-500",
    },
    {
      title: "Pertes & Périmés",
      description: "Suivi des produits proches de la date limite ou cassés.",
      icon: <AlertCircle className="h-7 w-7 text-red-600" />,
      href: "/super/perimes",
      color: "border-l-red-500",
    },
    {
      title: "Fidélité Clients",
      description: "Gestion des points et remises clients réguliers.",
      icon: <Users className="h-7 w-7 text-amber-600" />,
      href: "/super/fidelite",
      color: "border-l-amber-500",
    },
    {
      title: "Dépenses Boutique",
      description: "Petites charges opérationnelles quotidiennes.",
      icon: <Wallet className="h-7 w-7 text-orange-600" />,
      href: "/super/depenses",
      color: "border-l-orange-500",
    },
  ];

  return (
    <AppLayout
      title="Tableau de Bord Supérette"
      subtitle="Supervision des ventes et du magasin"
      rightElement={
        <button onClick={loadStats} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-7xl mx-auto">
        {/* Métrique CA du jour */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">CA du Jour</span>
            <div className="flex items-baseline gap-1">
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat('fr-FR').format(stats.todayRevenue)}
              </h4>
              <span className="text-xs font-bold text-zinc-400">XOF</span>
            </div>
          </div>
        </div>

        {/* Métrique Tickets */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl">
            <History className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tickets Émis</span>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
              {stats.todaySalesCount} <span className="text-sm font-medium text-zinc-500">tickets</span>
            </h4>
          </div>
        </div>

        {/* Métrique Alertes */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-1">Alertes Stock</span>
            <h4 className="text-xl font-black text-red-600">
              {stats.criticalStockCount} <span className="text-sm font-medium text-red-500/70">articles</span>
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx}>
            <Card hoverable className={`p-6 flex flex-col h-full border-l-4 ${mod.color} transition-all group rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl`}>
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {mod.icon}
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight uppercase tracking-tighter">{mod.title}</h3>
              <p className="text-xs font-bold text-zinc-500 leading-relaxed">{mod.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
