"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import {
  ShoppingCart,
  Wrench,
  Users,
  Building2,
  ArrowRight,
  UserCircle,
  Flame,
  BarChart2,
  Package,
  ClipboardList,
} from "lucide-react";

export default function AdminDashboardPage() {
  const modules = [
        {
          title: "Dashboard",
          desktopTitle: "Dashboard Analytique",
          description: "Vue globale des KPIs, ventes, boutiques et alertes opérationnelles en temps réel.",
          icon: <BarChart2 className="h-6 w-6 md:h-7 md:w-7 text-violet-500" />,
          href: "/admin/dashboard",
          color: "border-l-violet-500",
          bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
        },
        {
          title: "Boutiques",
          desktopTitle: "Gestion des Boutiques",
          description: "Configurez et suivez tous les points de vente.",
          icon: <Building2 className="h-6 w-6 md:h-7 md:w-7 text-primary" />,
          href: "/admin/boutiques",
          color: "border-l-primary",
          bgColor: "bg-primary/10 dark:bg-primary/20",
        },
        {
          title: "Utilisateurs",
          desktopTitle: "Gestion des Utilisateurs",
          description: "Créez des accès pour les caissières et gérants de boutiques.",
          icon: <Users className="h-6 w-6 md:h-7 md:w-7 text-secondary" />,
          href: "/admin/utilisateurs",
          color: "border-l-secondary",
          bgColor: "bg-secondary/10 dark:bg-secondary/20",
        },
        {
          title: "Supérette",
          desktopTitle: "Module Supérette",
          description: "Accès rapide à l'interface de vente et stocks du supermarché.",
          icon: <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-primary" />,
          href: "/super",
          color: "border-l-primary",
          bgColor: "bg-primary/10 dark:bg-primary/20",
        },
        {
          title: "Quincaillerie",
          desktopTitle: "Module Quincaillerie",
          description: "Interface de vente de matériaux et gestion des devis/factures.",
          icon: <Wrench className="h-6 w-6 md:h-7 md:w-7 text-secondary" />,
          href: "/quinc",
          color: "border-l-secondary",
          bgColor: "bg-secondary/10 dark:bg-secondary/20",
        },
        {
          title: "Produits",
          desktopTitle: "Gestion des Produits",
          description: "Contrôlez le catalogue, les prix de vente et l'état des stocks en temps réel.",
          icon: <Package className="h-6 w-6 md:h-7 md:w-7 text-emerald-500" />, // Utilise l'icône Package pour faire pro
          href: "/admin/produits", // Adapté à ton routage admin, ou "/produits" selon ta structure
          color: "border-l-emerald-500",
          bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
        },
    {
      title: "Approvis.",
      desktopTitle: "Approvisionnement & Devis",
      description: "Émettez des bons de commande fournisseurs, gérez les réapprovisionnements et éditez vos devis clients.",
      icon: <ClipboardList  className="h-6 w-6 md:h-7 md:w-7 text-indigo-500" />,
      href: "/admin/devis", // ou "/approvisionnement" selon tes routes
      color: "border-l-indigo-500",
      bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    },
    {
      title: "Bilan",
      desktopTitle: "Bilan financier",
      description: "Gestion des bouteilles de gaz, recharges et livraisons.",
      icon: <Flame className="h-6 w-6 md:h-7 md:w-7 text-amber-500" />,
      href: "/admin/bilan",
      color: "border-l-amber-500",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      title: "Mon Profil",
      desktopTitle: "Mon Profil",
      description: "Gérez vos informations personnelles et mot de passe.",
      icon: <UserCircle className="h-6 w-6 md:h-7 md:w-7 text-zinc-500" />,
      href: "/profile",
      color: "border-l-zinc-400",
      bgColor: "bg-zinc-500/10 dark:bg-zinc-500/20",
    },
  ];

  return (
    <AppLayout
      title="Tableau de Bord Administrateur"
      subtitle="Gestion centralisée de SP SERVICES"
    >
      {/* SUR MOBILE : Grille à 3 colonnes compacte (grid-cols-3) sans gros espacements (gap-3)
        SUR DESKTOP : Reprise de ton ancienne grille fluide (md:grid-cols-2 lg:grid-cols-3 gap-6)
      */}
      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 px-1 md:px-0">
        {modules.map((mod, idx) => (
          <Link href={mod.href} key={idx} className="block active:scale-95 transition-transform md:active:scale-100">
            
            {/* La Card s'adapte : 
              - Sur mobile : Pas de bordure latérale (`border-none`), pas d'ombre, fond transparent ou léger, alignement centré.
              - Sur desktop : Rallume ton design de carte (`md:border-l-4`, `md:p-6`, etc.)
            */}
            <Card 
              hoverable 
              className={`
                p-2 md:p-6 flex flex-col items-center md:items-start text-center md:text-left h-full 
                border-none md:border-solid md:border-l-4 ${mod.color} 
                bg-transparent md:bg-white dark:md:bg-zinc-900 shadow-none md:shadow-sm hover:md:shadow-2xl transition-all
              `}
            >
              {/* Conteneur de l'icône */}
              <div className="flex items-center justify-between w-full md:mb-4">
                {/* Sur mobile : Parfaitement rond (`rounded-full`), taille fixe et carrée (`w-14 h-14`), icône centrée, fond coloré dynamique.
                  Sur desktop : Reprend ton style carré adouci (`md:rounded-2xl`, `md:bg-zinc-50`).
                */}
                <div className={`
                  flex items-center justify-center w-14 h-14 rounded-full ${mod.bgColor} 
                  md:w-auto md:h-auto md:rounded-2xl md:bg-zinc-50 md:dark:bg-zinc-800 md:p-3 
                  mx-auto md:mx-0 shadow-sm md:shadow-none
                `}>
                  {mod.icon}
                </div>
                
                {/* Masqué sur mobile, visible uniquement sur desktop */}
                <ArrowRight className="hidden md:block h-5 w-5 text-zinc-300" />
              </div>

              {/* Titre du module */}
              {/* Sur mobile : Texte court, centré, plus petit (`text-[11px]` ou `text-xs`). Sur desktop : ton `text-lg`. */}
              <h3 className="text-[11px] md:text-lg font-black text-zinc-800 dark:text-zinc-200 md:text-foreground mt-2 md:mt-0 mb-1 tracking-tight leading-tight line-clamp-1 md:line-clamp-none w-full">
                <span className="md:hidden">{mod.title}</span>
                <span className="hidden md:inline">{mod.desktopTitle}</span>
              </h3>

              {/* Description : Totalement masquée sur mobile, visible sur desktop */}
              <p className="hidden md:block text-xs font-bold text-zinc-500 leading-normal">
                {mod.description}
              </p>
            </Card>

          </Link>
        ))}
      </div>
    </AppLayout>
  );
}