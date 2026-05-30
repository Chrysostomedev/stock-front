"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import QuincSaleService from "@/services/quinc/sale.service";
import QuincProductService from "@/services/quinc/product.service";
import QuincCustomerService from "@/services/quinc/customer.service";
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Building2,
  Wallet,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export default function QuincaillerieDashboardPage() {
  const { user } = useAuth();
  const shopId = user?.shopId || "";

  const [salesToday, setSalesToday] = useState(0);
  const [creditsOut, setCreditsOut] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      // 1. Ventes du jour
      const sales = await QuincSaleService.getAll(shopId);
      const todayDate = new Date().toISOString().split("T")[0];
      const todaySales = sales.filter(s => s.createdAt?.startsWith(todayDate));
      const totalSalesToday = todaySales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
      setSalesToday(totalSalesToday);

      // 2. Crédits (Ventes partiellement payées)
      const creditSales = sales.filter(s => s.status === "PARTIALLY_PAID");
      const totalCredits = creditSales.reduce((acc, s) => acc + ((s.finalAmount || 0) - (s.paidAmount || 0)), 0);
      setCreditsOut(totalCredits);

      // 3. Stock critique
      const products = await QuincProductService.getAll(shopId);
      const critical = products.filter(p => p.stockQuantity <= (p.minStockAlert || 5));
      setCriticalStock(critical.length);

    } catch (err) {
      console.error("Erreur lors du chargement des métriques:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [shopId]);

  const modules = [
    {
      title: "Caisse",
      fullTitle: "Caisse Express",
      description: "Interface de vente rapide pour les clients de passage.",
      icon: <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />,
      href: "/quinc/caisse",
      color: "border-l-emerald-500",
      bgLight: "bg-emerald-500/10",
    },
    {
      title: "Stocks",
      fullTitle: "Stock Matériaux",
      description: "Gérez votre inventaire de ciment, fers, peinture, etc.",
      icon: <Package className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />,
      href: "/quinc/produits",
      color: "border-l-primary",
      bgLight: "bg-primary/10",
    },
    {
      title: "Bons",
      fullTitle: "Bons de Commande",
      description: "Édition de bons de commande pour les chantiers et fournisseurs.",
      icon: <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-600" />,
      href: "/quinc/devis",
      color: "border-l-zinc-500",
      bgLight: "bg-zinc-500/10",
    },
    {
      title: "Crédits",
      fullTitle: "Clients & Crédits",
      description: "Suivi des impayés, acomptes et historique client.",
      icon: <Users className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />,
      href: "/quinc/credits",
      color: "border-l-red-500",
      bgLight: "bg-red-500/10",
    },
    {
      title: "Fournisseurs",
      fullTitle: "Fournisseurs",
      description: "Commandes SOTACI, SCA et règlements dettes.",
      icon: <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />,
      href: "/quinc/fournisseurs",
      color: "border-l-amber-500",
      bgLight: "bg-amber-500/10",
    },
    {
      title: "Dépenses",
      fullTitle: "Dépenses & Charges",
      description: "Suivi du carburant, loyer, CIE et SODECI.",
      icon: <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />,
      href: "/quinc/depenses",
      color: "border-l-orange-500",
      bgLight: "bg-orange-500/10",
    },
  ];

  return (
    <AppLayout
      title="Gestion Quincaillerie"
      subtitle="Tableau de bord et outils métiers"
      rightElement={
        <button onClick={fetchMetrics} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      {/* 📊 Section Indicateurs / KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8 max-w-7xl mx-auto">
        {/* Ventes du jour */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Ventes du jour</span>
            <div className="flex items-baseline gap-1">
              <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {loading ? "..." : new Intl.NumberFormat('fr-FR').format(salesToday)}
              </h4>
              <span className="text-[10px] font-bold text-zinc-400">FCFA</span>
            </div>
          </div>
        </div>

        {/* Crédits Dehors */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-0.5">Crédits Dehors</span>
            <div className="flex items-baseline gap-1">
              <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {loading ? "..." : new Intl.NumberFormat('fr-FR').format(creditsOut)}
              </h4>
              <span className="text-[10px] font-bold text-zinc-400">FCFA</span>
            </div>
          </div>
        </div>

        {/* Stock Critique */}
        <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-0.5">Stock Critique</span>
            <div className="flex items-baseline gap-1">
              <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {loading ? "..." : `${criticalStock}`}
              </h4>
              <span className="text-[10px] font-bold text-zinc-400">articles</span>
            </div>
            {criticalStock > 0 && !loading && (
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-600 mt-0.5">Commande SOTACI requise</span>
            )}
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
