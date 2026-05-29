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
  RefreshCw
} from "lucide-react";

/**
 * Dashboard principal pour le module Supérette
 * Centralise les indicateurs clés de performance (KPI) et les raccourcis modules
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
      const salesRes = await SaleService.getAll({ shopId: user.shopId });
      const sales = salesRes.data && Array.isArray(salesRes.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);

      const today = new Date().toLocaleDateString();
      const todaySales = sales.filter((s: any) => new Date(s.createdAt).toLocaleDateString() === today);

      const revenue = todaySales.reduce((acc: number, s: any) => acc + Number(s.totalAmount || s.total || 0), 0);

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
      description: "Suivi des produits proches de la date limite ou cassés.",
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
      {/* 📊 Section Indicateurs / KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8 max-w-7xl mx-auto">
        {/* CA du jour */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">CA du Jour</span>
            <div className="flex items-baseline gap-1">
              <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {new Intl.NumberFormat('fr-FR').format(stats.todayRevenue)}
              </h4>
              <span className="text-[10px] font-bold text-zinc-400">XOF</span>
            </div>
          </div>
        </div>

        {/* Tickets Émis */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Tickets Émis</span>
            <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50">
              {stats.todaySalesCount} <span className="text-xs font-medium text-zinc-500">tickets</span>
            </h4>
          </div>
        </div>

        {/* Alertes Stock */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-0.5">Alertes Stock</span>
            <h4 className="text-lg sm:text-xl font-black text-red-600">
              {stats.criticalStockCount} <span className="text-xs font-medium text-red-500/70">articles</span>
            </h4>
          </div>
        </div>
      </div>

      {/* 📱 💻 GRILLE DE MODULES MUTABLE (Grid de 3 sur mobile, cartes détaillées sur desktop) */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-7xl mx-auto pb-10">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx} className="w-full">
            <Card 
              hoverable 
              className={`
                /* Style global & Desktop */
                flex flex-col justify-between transition-all duration-300 group rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl
                
                /* Ajustement Mobile : Grille à 3 icônes type Springboard */
                p-3 items-center text-center h-auto border-t-4 sm:border-t-0 sm:border-l-4 ${mod.color}
              `}
            >
              {/* Conteneur d'icône adaptatif */}
              <div className="flex sm:w-full items-center justify-between mb-2 sm:mb-6">
                <div className={`p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 ${mod.bgLight} sm:bg-zinc-50 rounded-xl sm:rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {mod.icon}
                </div>
                
                {/* Flèche masquée sur mobile pour gagner de la place */}
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              {/* Contenu textuel adaptatif */}
              <div className="flex flex-col items-center sm:items-start w-full min-w-0">
                {/* Titre court sur mobile, Titre complet sur Desktop */}
                <h3 className="text-[11px] sm:text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase sm:normal-case line-clamp-1 sm:line-clamp-none">
                  <span className="block sm:hidden">{mod.title}</span>
                  <span className="hidden sm:block">{mod.fullTitle}</span>
                </h3>
                
                {/* Description masquée sur mobile */}
                <p className="hidden sm:block text-xs font-bold text-zinc-500 leading-relaxed mt-2 text-left">
                  {mod.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}