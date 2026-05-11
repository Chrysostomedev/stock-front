"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  History,
} from "lucide-react";

export default function SuperDashboardPage() {
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
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">CA du Jour</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">342,500 FCFA</h4>
          <p className="text-[10px] font-bold text-emerald-600 mt-1">+8% vs hier</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <History className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tickets du Jour</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">84 tickets</h4>
          <p className="text-[10px] font-bold text-zinc-400 mt-1">Dernière vente il y a 2 min</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-red-500/5 to-transparent border-red-500/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-red-500/10 text-red-600 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Alertes Stock</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">12 articles</h4>
          <p className="text-[10px] font-bold text-red-600 mt-1">Seuil critique atteint</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx}>
            <Card hoverable className={`p-6 flex flex-col h-full border-l-4 ${mod.color} transition-all group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:rotate-12 transition-transform">
                  {mod.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1 tracking-tight">{mod.title}</h3>
              <p className="text-xs font-bold text-zinc-500 leading-normal">{mod.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
