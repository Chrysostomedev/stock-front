"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import {
  ShoppingCart,
  Wrench,
  Users,
  Settings,
  Building2,
  ArrowRight,
  UserCircle,
  Flame,
} from "lucide-react";

export default function AdminDashboardPage() {
  const modules = [
    {
      title: "Gestion des Boutiques",
      description: "Configurez les points de vente et entrepôts de gaz ou quincaillerie.",
      icon: <Building2 className="h-7 w-7 text-primary" />,
      href: "/admin/boutiques",
      color: "border-l-primary",
    },
    {
      title: "Gestion des Utilisateurs",
      description: "Créez des accès pour les caissières et gérants de boutiques.",
      icon: <Users className="h-7 w-7 text-secondary" />,
      href: "/admin/utilisateurs",
      color: "border-l-secondary",
    },
    {
      title: "Module Supérette",
      description: "Accès rapide à l'interface de vente et stocks du supermarché.",
      icon: <ShoppingCart className="h-7 w-7 text-primary" />,
      href: "/super",
      color: "border-l-primary",
    },
    {
      title: "Module Quincaillerie",
      description: "Interface de vente de matériaux et gestion des devis/factures.",
      icon: <Wrench className="h-7 w-7 text-secondary" />,
      href: "/quinc",
      color: "border-l-secondary",
    },
    {
      title: "Module Gaz & Livraisons",
      description: "Gestion des bouteilles de gaz, recharges et livraisons.",
      icon: <Flame className="h-7 w-7 text-amber-500" />,
      href: "/gaz",
      color: "border-l-amber-500",
    },
    {
      title: "Mon Profil",
      description: "Gérez vos informations personnelles et mot de passe.",
      icon: <UserCircle className="h-7 w-7 text-zinc-500" />,
      href: "/profile",
      color: "border-l-zinc-400",
    },
  ];

  return (
    <AppLayout
      title="Tableau de Bord Admin"
      subtitle="Gestion centralisée de SP SERVICES Stock"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx}>
            <Card hoverable className={`p-6 flex flex-col h-full border-l-4 ${mod.color} hover:shadow-2xl transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                  {mod.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-300" />
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
