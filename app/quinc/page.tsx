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
  Layers,
  Wallet,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function QuincaillerieDashboardPage() {
  const { user } = useAuth();
  const shopId = user?.shopId || "";

  const [salesToday, setSalesToday] = useState(0);
  const [creditsOut, setCreditsOut] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // 1. Ventes du jour (On simplifie en prenant tout ou en filtrant côté front si backend ne le fait pas)
        const sales = await QuincSaleService.getAll(shopId);
        const today = new Date().toISOString().split("T")[0];
        const todaySales = sales.filter(s => s.createdAt?.startsWith(today));
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

    fetchMetrics();
  }, [shopId]);

  const modules = [
    {
      title: "Caisse Express",
      description: "Interface de vente rapide pour les clients de passage.",
      icon: <ShoppingCart className="h-7 w-7 text-emerald-600" />,
      href: "/quinc/caisse",
      color: "border-l-emerald-500",
    },
    {
      title: "Stock Matériaux",
      description: "Gérez votre inventaire de ciment, fers, peinture, etc.",
      icon: <Package className="h-7 w-7 text-primary" />,
      href: "/quinc/produits",
      color: "border-l-primary",
    },
    {
      title: "Bons de Commande",
      description: "Édition de bons de commande pour les chantiers et fournisseurs.",
      icon: <FileText className="h-7 w-7 text-zinc-600" />,
      href: "/quinc/devis",
      color: "border-l-zinc-500",
    },
    {
      title: "Clients & Crédits",
      description: "Suivi des impayés, acomptes et historique client.",
      icon: <Users className="h-7 w-7 text-red-600" />,
      href: "/quinc/credits",
      color: "border-l-red-500",
    },
    {
      title: "Fournisseurs",
      description: "Commandes SOTACI, SCA et règlements dettes.",
      icon: <Building2 className="h-7 w-7 text-amber-600" />,
      href: "/quinc/fournisseurs",
      color: "border-l-amber-500",
    },
    {
      title: "Dépenses & Charges",
      description: "Suivi du carburant, loyer, CIE et SODECI.",
      icon: <Wallet className="h-7 w-7 text-orange-600" />,
      href: "/quinc/depenses",
      color: "border-l-orange-500",
    },
  ];

  return (
    <AppLayout
      title="Gestion Quincaillerie"
      subtitle="Tableau de bord et outils métiers"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Ventes du jour</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">
            {loading ? "..." : `${salesToday.toLocaleString()} FCFA`}
          </h4>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-red-500/5 to-transparent border-red-500/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-red-500/10 text-red-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Crédits Dehors</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">
            {loading ? "..." : `${creditsOut.toLocaleString()} FCFA`}
          </h4>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Stock Critique</span>
          </div>
          <h4 className="text-2xl font-black text-foreground">
            {loading ? "..." : `${criticalStock} articles`}
          </h4>
          {criticalStock > 0 && !loading && (
            <p className="text-[10px] font-bold text-amber-600 mt-1">Commande SOTACI requise</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx}>
            <Card hoverable className={`p-6 flex flex-col h-full border-l-4 ${mod.color} transition-all group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                  {mod.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-primary transition-colors" />
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
