"use client";

import React, { useState, useMemo } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers,
  Truck,
  UserCheck,
  Shield,
  Settings,
  Tag,
  Search,
  ArrowUpRight,
} from "lucide-react";

type ModuleCategory = "all" | "pos" | "stock" | "finance" | "admin";

type Module = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: ModuleCategory;
  categoryLabel: string;
  badge: string;
  badgeType: "success" | "info" | "warning" | "purple" | "blue";
  Icon: React.FC<{ className?: string }>;
  href: string;
  mobileGrad: string;
  gradient: string;
  accentColor: string;
  statLabel: string;
  disabled?: boolean;
};

export default function AdminDashboardPage() {
  const [showQuincNotice, setShowQuincNotice] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>("all");

  const modules: Module[] = [
    {
      id: "dashboard",
      title: "Dashboard Analytique",
      shortTitle: "Dashboard",
      description: "Vue globale des KPIs, ventes, boutiques et alertes opérationnelles en temps réel.",
      category: "all",
      categoryLabel: "Pilotage Global",
      badge: "Temps Réel",
      badgeType: "purple",
      Icon: BarChart2,
      href: "/admin/dashboard",
      mobileGrad: "from-violet-600 to-indigo-700",
      gradient: "from-violet-600 via-indigo-600 to-purple-700",
      accentColor: "#8b5cf6",
      statLabel: "KPIs & Graphiques",
    },
    {
      id: "boutiques",
      title: "Gestion des Boutiques",
      shortTitle: "Boutiques",
      description: "Supervisez tous vos points de vente, caisses physiques et affectations d'équipes.",
      category: "pos",
      categoryLabel: "Points de Vente",
      badge: "Multi-Sites",
      badgeType: "blue",
      Icon: Building2,
      href: "/admin/boutiques",
      mobileGrad: "from-blue-600 to-blue-800",
      gradient: "from-blue-600 to-cyan-600",
      accentColor: "#0284c7",
      statLabel: "Configuration caisses",
    },
    {
      id: "superette",
      title: "Caisse Supérette (POS)",
      shortTitle: "Supérette",
      description: "Accès direct au terminal de caisse, scanner code-barres et encaissement rapide.",
      category: "pos",
      categoryLabel: "Vente au Détail",
      badge: "Caisse Rapide",
      badgeType: "success",
      Icon: ShoppingCart,
      href: "/super",
      mobileGrad: "from-emerald-500 to-emerald-700",
      gradient: "from-emerald-500 to-teal-600",
      accentColor: "#10b981",
      statLabel: "Scan & Tickets",
    },
    {
      id: "quincaillerie",
      title: "Module Quincaillerie",
      shortTitle: "Quincaill.",
      description: "Vente de matériaux, gestion des unités lourdes, devis BTP et factures clients.",
      category: "pos",
      categoryLabel: "Négoce Matériaux",
      badge: "Gérant Requis",
      badgeType: "warning",
      Icon: Wrench,
      href: "/quinc",
      mobileGrad: "from-amber-500 to-amber-700",
      gradient: "from-amber-500 to-orange-600",
      accentColor: "#f59e0b",
      statLabel: "Chantiers & Gros",
      disabled: true,
    },
    {
      id: "produits",
      title: "Catalogue Produits",
      shortTitle: "Produits",
      description: "Catalogue unifié, codes-barres, prix d'achat/vente, marges et seuils d'alerte.",
      category: "stock",
      categoryLabel: "Catalogue & Prix",
      badge: "Centralisé",
      badgeType: "blue",
      Icon: Package,
      href: "/admin/produits",
      mobileGrad: "from-teal-500 to-teal-700",
      gradient: "from-teal-500 to-emerald-600",
      accentColor: "#14b8a6",
      statLabel: "Fiches articles",
    },
    {
      id: "categories",
      title: "Rayons & Catégories",
      shortTitle: "Catégories",
      description: "Organisation du catalogue par familles de produits, taxes et classification interne.",
      category: "stock",
      categoryLabel: "Organisation",
      badge: "Taxonomie",
      badgeType: "info",
      Icon: Tag,
      href: "/admin/categories",
      mobileGrad: "from-cyan-600 to-blue-700",
      gradient: "from-cyan-600 to-blue-600",
      accentColor: "#06b6d4",
      statLabel: "Rayons organisés",
    },
    {
      id: "inventory",
      title: "Inventaire & Stock",
      shortTitle: "Inventaire",
      description: "Valeur totale du stock, rotation, produits dormants et alertes de rupture critique.",
      category: "stock",
      categoryLabel: "Stock & Analyse",
      badge: "Audit Stock",
      badgeType: "warning",
      Icon: BarChart3,
      href: "/admin/inventory",
      mobileGrad: "from-orange-500 to-orange-700",
      gradient: "from-orange-500 to-amber-600",
      accentColor: "#f97316",
      statLabel: "Valorisation PUMP",
    },
    {
      id: "transferts",
      title: "Transferts Inter-Dépôts",
      shortTitle: "Transferts",
      description: "Mouvements de stocks entre entrepôt central et boutiques avec bons d'expédition signés.",
      category: "stock",
      categoryLabel: "Logistique Interne",
      badge: "Bons Signés",
      badgeType: "purple",
      Icon: Layers,
      href: "/admin/transferts",
      mobileGrad: "from-purple-600 to-indigo-800",
      gradient: "from-purple-600 to-indigo-600",
      accentColor: "#9333ea",
      statLabel: "Traçabilité flux",
    },
    {
      id: "clients",
      title: "Clients & Crédits",
      shortTitle: "Clients",
      description: "Suivi des comptes clients, encours autorisés, alertes de dépassement et recouvrements.",
      category: "finance",
      categoryLabel: "Créances & Tiers",
      badge: "Solvabilité",
      badgeType: "warning",
      Icon: UserCheck,
      href: "/admin/clients",
      mobileGrad: "from-rose-500 to-red-700",
      gradient: "from-rose-500 to-red-600",
      accentColor: "#f43f5e",
      statLabel: "Gestion des dettes",
    },
    {
      id: "devis",
      title: "Approvis. & Devis",
      shortTitle: "Approvis.",
      description: "Édition de devis proforma, commandes fournisseurs et suivi des réapprovisionnements.",
      category: "finance",
      categoryLabel: "Achats & Devis",
      badge: "Flux Fournisseurs",
      badgeType: "info",
      Icon: ClipboardList,
      href: "/admin/devis",
      mobileGrad: "from-indigo-500 to-indigo-700",
      gradient: "from-indigo-600 to-sky-600",
      accentColor: "#4f46e5",
      statLabel: "Bons & Factures",
    },
    {
      id: "fournisseurs",
      title: "Annuaire Fournisseurs",
      shortTitle: "Fournisseurs",
      description: "Répertoire des partenaires commerciaux, conditions de règlement et délais de livraison.",
      category: "finance",
      categoryLabel: "Relations Achats",
      badge: "Approvisionnement",
      badgeType: "blue",
      Icon: Truck,
      href: "/admin/fournisseurs",
      mobileGrad: "from-sky-500 to-sky-700",
      gradient: "from-sky-600 to-blue-700",
      accentColor: "#0284c7",
      statLabel: "Fiches partenaires",
    },
    {
      id: "utilisateurs",
      title: "Gestion Utilisateurs",
      shortTitle: "Utilisateurs",
      description: "Gestion des comptes d'accès, affectations aux caisses et réinitialisation des mots de passe.",
      category: "admin",
      categoryLabel: "Droits d'Accès",
      badge: "Sécurité Rôles",
      badgeType: "blue",
      Icon: Users,
      href: "/admin/utilisateurs",
      mobileGrad: "from-blue-500 to-blue-700",
      gradient: "from-blue-600 to-indigo-600",
      accentColor: "#2563eb",
      statLabel: "Caissiers & Gérants",
    },
    {
      id: "logs",
      title: "Journal d'Activité & Audit",
      shortTitle: "Logs",
      description: "Traçabilité des opérations sensibles, modifications de stock et historique d'audit.",
      category: "admin",
      categoryLabel: "Sécurité & Audit",
      badge: "Conformité",
      badgeType: "purple",
      Icon: Shield,
      href: "/admin/logs",
      mobileGrad: "from-slate-700 to-zinc-900",
      gradient: "from-slate-700 to-zinc-900",
      accentColor: "#64748b",
      statLabel: "Audit trail complet",
    },
    {
      id: "settings",
      title: "Paramètres Généraux",
      shortTitle: "Paramètres",
      description: "Coordonnées de l'entreprise, configuration des devises, tickets et préférences globales.",
      category: "admin",
      categoryLabel: "Système",
      badge: "Configuration",
      badgeType: "info",
      Icon: Settings,
      href: "/admin/settings",
      mobileGrad: "from-zinc-600 to-slate-800",
      gradient: "from-zinc-600 to-slate-800",
      accentColor: "#71717a",
      statLabel: "Options système",
    },
    {
      id: "profile",
      title: "Mon Profil",
      shortTitle: "Profil",
      description: "Gérez vos informations personnelles, votre numéro de téléphone et votre mot de passe.",
      category: "admin",
      categoryLabel: "Compte Perso",
      badge: "Mon Compte",
      badgeType: "info",
      Icon: UserCircle,
      href: "/profile",
      mobileGrad: "from-zinc-500 to-zinc-700",
      gradient: "from-zinc-500 to-zinc-700",
      accentColor: "#a1a1aa",
      statLabel: "Identifiants actifs",
    },
  ];

  // Filtrage combiné (utilisé sur Desktop)
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchesCategory =
        activeCategory === "all" || mod.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.categoryLabel.toLowerCase().includes(q) ||
        mod.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [modules, activeCategory, searchQuery]);

  const categories: { id: ModuleCategory; label: string; count: number }[] = [
    { id: "all", label: "Tous les modules", count: modules.length },
    {
      id: "pos",
      label: "Points de Vente & Caisses",
      count: modules.filter((m) => m.category === "pos").length,
    },
    {
      id: "stock",
      label: "Stocks & Catalogue",
      count: modules.filter((m) => m.category === "stock").length,
    },
    {
      id: "finance",
      label: "Clients & Approvisionnement",
      count: modules.filter((m) => m.category === "finance").length,
    },
    {
      id: "admin",
      label: "Équipe & Système",
      count: modules.filter((m) => m.category === "admin").length,
    },
  ];

  const getBadgeClasses = (type: Module["badgeType"]) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    }
  };

  return (
    <AppLayout
      title="Tableau de Bord Administrateur"
      subtitle="Gestion centralisée de SP SERVICES"
    >
      {/* ── SECTION LABEL & OUTILS DESKTOP (Masqué sur mobile) ──────── */}
      <div className="hidden md:flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Modules Disponibles
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {filteredModules.length} actifs
            </span>
          </div>

          {/* Recherche rapide Desktop */}
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer un module..."
              className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-10 pr-9 py-2 text-xs font-bold text-foreground placeholder-zinc-400 outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Onglets Filtres Catégories Desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20"
                    : "bg-white/80 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VUE MOBILE DÉDIÉE : GRILLE D'ACCUEIL STYLE SMARTPHONE (3 COLONNES) ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:hidden mb-6">
        {modules.map((mod) => {
          const { Icon } = mod;
          const cardMobile = (
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${mod.mobileGrad} flex min-h-[96px] flex-col items-center justify-center gap-2 p-2.5 shadow-md shadow-black/10 border border-white/20 active:scale-95 transition-transform cursor-pointer`}
            >
              {mod.disabled && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-white/50 animate-pulse" />
              )}
              <div className="flex items-center justify-center rounded-xl bg-white/20 p-2.5 backdrop-blur-md shadow-inner">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="line-clamp-2 text-center text-[10.5px] font-black leading-tight text-white drop-shadow-sm px-0.5">
                {mod.shortTitle}
              </span>
            </div>
          );

          if (mod.disabled) {
            return (
              <div key={mod.id} onClick={() => setShowQuincNotice(true)}>
                {cardMobile}
              </div>
            );
          }

          return (
            <Link key={mod.id} href={mod.href} className="block">
              {cardMobile}
            </Link>
          );
        })}
      </div>

      {/* ── VUE DESKTOP DÉDIÉE : NOUVELLES CARTES PRO ────────────────── */}
      {filteredModules.length === 0 ? (
        <div className="hidden md:block rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
          <Search className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Aucun module ne correspond à votre recherche
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Essayez avec un mot-clé différent ou réinitialisez les filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const { Icon } = mod;

            const cardContent = (
              <div
                className={`group relative h-full flex flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-300 ${
                  mod.disabled
                    ? "bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 opacity-80"
                    : "bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-blue-500/40 dark:hover:border-blue-500/40"
                }`}
              >
                {/* Lueur subtile en arrière-plan sur hover */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ backgroundColor: mod.accentColor + "25" }}
                />

                {/* Barre supérieure d'accentuation dynamique */}
                <div
                  className={`absolute left-0 right-0 top-0 h-[3.5px] bg-gradient-to-r ${mod.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                />

                {/* ── HAUT DE LA CARTE : ICÔNE + BADGE ── */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Icône avec container stylisé */}
                    <div
                      className={`relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br ${mod.gradient} p-[1.5px] shadow-md transition-transform duration-300 group-hover:scale-105`}
                    >
                      <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[14px] flex items-center justify-center">
                        <Icon className="h-5 w-5 text-zinc-800 dark:text-white transition-colors group-hover:text-blue-500" />
                      </div>
                    </div>

                    {/* Badge de statut / rôle */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getBadgeClasses(
                          mod.badgeType
                        )}`}
                      >
                        {mod.disabled && <AlertTriangle className="h-2.5 w-2.5" />}
                        {mod.badge}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                        {mod.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Titre & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>{mod.title}</span>
                      {!mod.disabled && (
                        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-blue-500" />
                      )}
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2">
                      {mod.disabled
                        ? "Nécessite les identifiants d'un compte Gérant Quincaillerie pour les opérations de caisse et devis."
                        : mod.description}
                    </p>
                  </div>
                </div>

                {/* ── BAS DE LA CARTE : STAT / ACTION PILL ── */}
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-blue-500 transition-colors" />
                    <span>{mod.statLabel}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{mod.disabled ? "En savoir +" : "Ouvrir"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );

            if (mod.disabled) {
              return (
                <div
                  key={mod.id}
                  onClick={() => setShowQuincNotice(true)}
                  className="cursor-pointer"
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={mod.id} href={mod.href} className="block">
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── MODAL EXPLICATIVE QUINCAILLERIE ───────────────────────── */}
      <AnimatePresence>
        {showQuincNotice && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowQuincNotice(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 pb-4 pt-6 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 rounded-2xl bg-amber-500/10 p-3 border border-amber-500/20">
                    <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">
                      Module Quincaillerie
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Accès Restreint au Rôle Gérant
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
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">
                  Le module <strong className="text-zinc-900 dark:text-white">Quincaillerie</strong> est
                  spécifiquement configuré pour les opérations du point de vente de matériaux.
                </p>

                <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/60 dark:bg-amber-950/20">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Comment y accéder ?
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                    Déconnectez-vous et connectez-vous avec les identifiants d'un{" "}
                    <strong>Gérant Quincaillerie</strong> pour activer les fonctions de caisse,
                    suivi des devis proforma, commandes fournisseurs et dettes chantiers.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <LogIn className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>Redirection automatique dès la connexion du compte adéquat.</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                <button
                  onClick={() => setShowQuincNotice(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Compris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
