"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Link from "next/link";
import {
  ShoppingCart,
  Wrench,
  Users,
  Building2,
  ChevronRight,
  UserCircle,
  BarChart2,
  BarChart3,
  Package,
  ClipboardList,
  X,
  LogIn,
  AlertTriangle,
} from "lucide-react";

type Module = {
  title: string;
  desktopTitle: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  href: string;
  mobileGrad: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  disabled?: boolean;
};

export default function AdminDashboardPage() {
  const [showQuincNotice, setShowQuincNotice] = useState(false);

  const modules: Module[] = [
    {
      title: "Dashboard",
      desktopTitle: "Dashboard Analytique",
      description: "Vue globale des KPIs, ventes, boutiques et alertes opérationnelles en temps réel.",
      Icon: BarChart2,
      href: "/admin/dashboard",
      mobileGrad: "from-violet-500 to-violet-700",
      accent: "from-violet-500 to-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Boutiques",
      desktopTitle: "Gestion des Boutiques",
      description: "Configurez et suivez tous les points de vente.",
      Icon: Building2,
      href: "/admin/boutiques",
      mobileGrad: "from-blue-500 to-blue-700",
      accent: "from-blue-500 to-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Utilisateurs",
      desktopTitle: "Gestion des Utilisateurs",
      description: "Créez des accès pour les caissières et gérants de boutiques.",
      Icon: Users,
      href: "/admin/utilisateurs",
      mobileGrad: "from-sky-500 to-sky-700",
      accent: "from-sky-500 to-sky-400",
      iconBg: "bg-sky-100 dark:bg-sky-900/40",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Supérette",
      desktopTitle: "Module Supérette",
      description: "Accès rapide à l'interface de vente et stocks du supermarché.",
      Icon: ShoppingCart,
      href: "/super",
      mobileGrad: "from-emerald-500 to-emerald-700",
      accent: "from-emerald-500 to-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Quincaill.",
      desktopTitle: "Module Quincaillerie",
      description: "Interface de vente de matériaux et gestion des devis/factures.",
      Icon: Wrench,
      href: "/quinc",
      mobileGrad: "from-amber-500 to-amber-700",
      accent: "from-amber-500 to-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      disabled: true,
    },
    {
      title: "Produits",
      desktopTitle: "Gestion des Produits",
      description: "Contrôlez le catalogue, les prix de vente et l'état des stocks en temps réel.",
      Icon: Package,
      href: "/admin/produits",
      mobileGrad: "from-teal-500 to-teal-700",
      accent: "from-teal-500 to-teal-400",
      iconBg: "bg-teal-100 dark:bg-teal-900/40",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Inventaire",
      desktopTitle: "Inventaire & Stock",
      description: "Valorisation du stock, top produits, alertes de rupture et produits dormants.",
      Icon: BarChart3,
      href: "/admin/inventory",
      mobileGrad: "from-orange-500 to-orange-700",
      accent: "from-orange-500 to-orange-400",
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Approvis.",
      desktopTitle: "Approvisionnement & Devis",
      description: "Émettez des bons de commande fournisseurs, gérez les réapprovisionnements et éditez vos devis clients.",
      Icon: ClipboardList,
      href: "/admin/devis",
      mobileGrad: "from-indigo-500 to-indigo-700",
      accent: "from-indigo-500 to-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Profil",
      desktopTitle: "Mon Profil",
      description: "Gérez vos informations personnelles et mot de passe.",
      Icon: UserCircle,
      href: "/profile",
      mobileGrad: "from-zinc-500 to-zinc-700",
      accent: "from-zinc-400 to-zinc-500",
      iconBg: "bg-zinc-100 dark:bg-zinc-800",
      iconColor: "text-zinc-600 dark:text-zinc-400",
    },
  ];

  return (
    <AppLayout title="Tableau de Bord Administrateur" subtitle="Gestion centralisée de SP SERVICES">

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative mb-5 md:mb-8 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-5 py-5 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40 md:text-xs">
              Administration centrale
            </p>
            <h1 className="text-xl font-black tracking-tight text-white md:text-3xl">SP SERVICES</h1>
            <p className="mt-1 hidden text-sm text-white/40 md:block">
              Panneau de contrôle · Gérez tous vos modules depuis cet espace
            </p>
          </div>
          <div className="hidden flex-col items-end gap-1.5 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">Système actif</span>
            </div>
            <span className="text-[10px] text-white/30">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <div className="md:hidden flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* ── Section label (desktop only) ─────────────────────────── */}
      <p className="mb-3 hidden text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 md:block">
        Modules disponibles
      </p>

      {/* ── Module Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {modules.map((mod, idx) => {
          const { Icon } = mod;

          const card = (
            <div
              className={[
                "group relative h-full overflow-hidden rounded-2xl transition-all duration-300",
                "md:bg-white md:dark:bg-zinc-900",
                "md:border md:border-zinc-100 md:dark:border-zinc-800/60",
                "md:shadow-sm md:hover:shadow-xl md:hover:-translate-y-1",
                mod.disabled ? "opacity-60" : "",
              ].join(" ")}
            >
              {/* Desktop: top accent stripe */}
              <div
                className={`absolute left-0 right-0 top-0 hidden h-[3px] bg-gradient-to-r ${mod.accent} md:block`}
              />

              {/* ── MOBILE layout ─── */}
              <div
                className={`md:hidden relative bg-gradient-to-br ${mod.mobileGrad} flex min-h-[90px] flex-col items-center justify-center gap-2 px-2 py-3`}
              >
                {mod.disabled && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-white/30" />
                )}
                <div className="flex items-center justify-center rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="line-clamp-2 text-center text-[10px] font-black leading-tight text-white drop-shadow-sm">
                  {mod.title}
                </span>
              </div>

              {/* ── DESKTOP layout ─── */}
              <div className="hidden h-full flex-col p-5 pt-6 md:flex">
                {mod.disabled && (
                  <span className="absolute right-3 top-[18px] flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Gérant
                  </span>
                )}

                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex items-center justify-center rounded-xl p-2.5 ${mod.iconBg}`}>
                    <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                  </div>
                  {!mod.disabled && (
                    <ChevronRight className="h-4 w-4 text-zinc-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400" />
                  )}
                </div>

                <h3 className="mb-1.5 text-sm font-black leading-snug text-zinc-800 dark:text-zinc-100">
                  {mod.desktopTitle}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                  {mod.disabled
                    ? "Non disponible en administration. Connectez-vous avec un compte Gérant Quincaillerie pour accéder à ce module."
                    : mod.description}
                </p>
              </div>
            </div>
          );

          if (mod.disabled) {
            return (
              <div
                key={idx}
                className="cursor-pointer transition-transform active:scale-95 md:active:scale-100"
                onClick={() => setShowQuincNotice(true)}
              >
                {card}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              href={mod.href}
              className="block transition-transform active:scale-95 md:active:scale-100"
            >
              {card}
            </Link>
          );
        })}
      </div>

      {/* ── Modal Quincaillerie ───────────────────────────────────── */}
      {showQuincNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowQuincNotice(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 pb-4 pt-6 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-2xl bg-amber-100 p-2.5 dark:bg-amber-900/30">
                  <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                    Module Quincaillerie
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Non disponible côté Administration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuincNotice(false)}
                className="flex-shrink-0 rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Le module{" "}
                <span className="font-black text-zinc-900 dark:text-zinc-100">Quincaillerie</span>{" "}
                n&apos;est pas encore accessible depuis le tableau de bord administrateur.
              </p>

              <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Pour accéder à ce module
                </p>
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Connectez-vous avec un{" "}
                  <span className="font-black">compte Gérant Quincaillerie</span> pour bénéficier de toutes les fonctionnalités : caisse, gestion des stocks, historique des ventes, devis clients, fournisseurs et dépenses.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                <LogIn className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Déconnectez-vous et reconnectez-vous avec les identifiants du Gérant.</span>
              </div>
            </div>

            <div className="flex justify-end px-6 pb-5">
              <button
                onClick={() => setShowQuincNotice(false)}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
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
