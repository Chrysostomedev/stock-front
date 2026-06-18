"use client";

import React, { useState } from "react";
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
  BarChart2,
  BarChart3,
  Package,
  ClipboardList,
  X,
  LogIn,
  AlertTriangle,
} from "lucide-react";
export default function AdminDashboardPage() {
  const [showQuincNotice, setShowQuincNotice] = useState(false);

  type Module = { title: string; desktopTitle: string; description: string; icon: React.ReactNode; href: string; color: string; bgColor: string; disabled?: boolean };
  const modules: Module[] = [
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
          icon: <Wrench className="h-6 w-6 md:h-7 md:w-7 text-amber-500" />,
          href: "/quinc",
          color: "border-l-amber-400",
          bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
          disabled: true,
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
        title: "Inventaire",
        desktopTitle: "Inventaire & Stock",
        description: "Valorisation du stock, top produits, alertes de rupture et produits dormants.",
        icon: <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-amber-500" />,
        href: "/admin/inventory",
        color: "border-l-amber-500",
        bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
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
        {modules.map((mod, idx) => {
          const cardContent = (
            <Card
              hoverable={!mod.disabled}
              className={`
                p-2 md:p-6 flex flex-col items-center md:items-start text-center md:text-left h-full
                border-none md:border-solid md:border-l-4 ${mod.color}
                bg-transparent md:bg-white dark:md:bg-zinc-900 shadow-none md:shadow-sm hover:md:shadow-2xl transition-all
                ${mod.disabled ? "opacity-75" : ""}
                relative overflow-hidden
              `}
            >
              {/* Badge "Non dispo. admin" sur la carte Quincaillerie */}
              {mod.disabled && (
                <div className="hidden md:flex absolute top-3 right-3 items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-300 dark:border-amber-700">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Accès Gérant
                </div>
              )}
              {/* Badge mobile */}
              {mod.disabled && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 md:hidden" title="Accès Gérant uniquement" />
              )}
              <div className="flex items-center justify-between w-full md:mb-4">
                <div className={`
                  flex items-center justify-center w-14 h-14 rounded-full ${mod.bgColor}
                  md:w-auto md:h-auto md:rounded-2xl md:bg-zinc-50 md:dark:bg-zinc-800 md:p-3
                  mx-auto md:mx-0 shadow-sm md:shadow-none
                `}>
                  {mod.icon}
                </div>
                {mod.disabled
                  ? <AlertTriangle className="hidden md:block h-5 w-5 text-amber-400" />
                  : <ArrowRight className="hidden md:block h-5 w-5 text-zinc-300" />
                }
              </div>
              <h3 className="text-[11px] md:text-lg font-black text-zinc-800 dark:text-zinc-200 md:text-foreground mt-2 md:mt-0 mb-1 tracking-tight leading-tight line-clamp-1 md:line-clamp-none w-full">
                <span className="md:hidden">{mod.title}</span>
                <span className="hidden md:inline">{mod.desktopTitle}</span>
              </h3>

              <p className="hidden md:block text-xs font-bold text-zinc-500 leading-normal">
                {mod.disabled
                  ? "Non disponible en administration. Connectez-vous avec un compte Gérant Quincaillerie pour accéder à ce module."
                  : mod.description
                }
              </p>
            </Card>
          );

          if (mod.disabled) {
            return (
              <div key={idx} className="cursor-pointer active:scale-95 transition-transform md:active:scale-100" onClick={() => setShowQuincNotice(true)}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link href={mod.href} key={idx} className="block active:scale-95 transition-transform md:active:scale-100">
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/* Modal notice Quincaillerie */}
      {showQuincNotice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQuincNotice(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex-shrink-0">
                  <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wide">Module Quincaillerie</h3>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Non disponible côté Administration
                  </p>
                </div>
              </div>
              <button onClick={() => setShowQuincNotice(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex-shrink-0">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            {/* Corps */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Le module <span className="font-black text-zinc-900 dark:text-zinc-100">Quincaillerie</span> n&apos;est pas encore accessible depuis le tableau de bord administrateur.
              </p>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col gap-2">
                <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pour accéder à ce module</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Connectez-vous avec un <span className="font-black">compte Gérant Quincaillerie</span> pour bénéficier de toutes les fonctionnalités : caisse, gestion des stocks, historique des ventes, devis clients, fournisseurs et dépenses.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold">
                <LogIn className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Déconnectez-vous et reconnectez-vous avec les identifiants du Gérant.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => setShowQuincNotice(false)}
                className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}