"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  UserCircle,
  Users,
  UserCheck,
  LogOut,
  Layers,
  FileText,
  Package,
  Building2,
  AlertCircle,
  Tag,
  TrendingUp,
  Truck,
  Shield,
  Menu,
  Wallet,
} from "lucide-react";
import { UserRole } from "@/types/auth";

import { useSidebar } from "@/contexts/SidebarContext";
import ConfirmModal from "../ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close, toggle } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Liste globale de toutes les navigations
  const allLinks = [
    { href: "/admin", label: "Administration", shortLabel: "Admin", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/boutiques", label: "Boutiques", icon: <Building2 className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/clients", label: "Clients & Crédits", shortLabel: "Clients", icon: <UserCheck className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/produits", label: "Catalogue Produits", icon: <Package className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/categories", label: "Catégories", icon: <Tag className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/transferts", label: "Transferts de Stock", shortLabel: "Transferts", icon: <Layers className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/devis", label: "Bons de Commande", icon: <FileText className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/fournisseurs", label: "Fournisseurs", icon: <Truck className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/logs", label: "Journal d'activité", shortLabel: "Logs", icon: <Shield className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    // Caissière Superette
    { href: "/super", label: "Dashboard Super.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/caisse", label: "Caisse Super.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/produits", label: "Stocks Produits", icon: <Package className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/commandes", label: "Historique Ventes", icon: <FileText className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/perimes", label: "Pertes & Périmés", icon: <AlertCircle className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/fidelite", label: "Fidélité Clients", icon: <Users className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/depenses", label: "Dépenses Boutique", icon: <Wallet className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/transferts", label: "Transferts Stock", icon: <Layers className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/settings", label: "Paramètres Boutique", icon: <Settings className="h-5 w-5" />, roles: ["CASHIER"] },

    // Gérant Quincaillerie
    { href: "/quinc", label: "Dashboard Quinc.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/caisse", label: "Caisse Quinc.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/produits", label: "Stock Matériaux", icon: <Package className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/commandes", label: "Historique Ventes", icon: <FileText className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/devis", label: "Bons de Commande", icon: <FileText className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/credits", label: "Clients & Crédits", icon: <Users className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/fournisseurs", label: "Fournisseurs", icon: <Building2 className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/transferts", label: "Transferts Stock", icon: <Layers className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/depenses", label: "Dépenses/Charges", icon: <Wallet className="h-5 w-5" />, roles: ["MANAGER"] },

    { href: "/profile", label: "Mon Profil", icon: <UserCircle className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN", "CASHIER", "MANAGER", "AUDITOR"] },
    { href: "/admin/settings", label: "Paramètres", icon: <Settings className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
  ];

  // Les menus cibles à placer en bas sur mobile
  const bottomMobileLabels = ["Administration", "Transferts de Stock", "Journal d'activité"];

  // userRole est undefined pendant le SSR et le premier rendu client (avant useEffect)
  // pour que le HTML serveur === HTML client → pas de mismatch d'hydratation
  const userRole = (mounted ? user?.role : undefined) as UserRole | undefined;
  const allowedLinks = allLinks.filter((link) => userRole && link.roles.includes(userRole));

  // Filtrage des liens pour la vue mobile
  const bottomNavLinks = allowedLinks.filter((link) => bottomMobileLabels.includes(link.label));
  const sidebarLinks = allowedLinks.filter((link) => !bottomMobileLabels.includes(link.label));

  return (
    <>
      {/* Overlay pour la sidebar mobile quand elle s'ouvre depuis le bas */}
      {isOpen && (
        <div
          onClick={close}
          className="sm:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-all"
        />
      )}

      {/* 💻 1. SIDEBAR TRADITIONNELLE (Desktop complet / Mobile tiroir masquant les icônes du bas) */}
      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-[70] w-64 bg-card border-r border-border p-4 flex flex-col justify-between transition-all duration-300 select-none transform ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Company Info */}
          <div className="flex flex-col gap-3 px-2">
            <Link
              href={
                userRole === "ADMIN" || userRole === "SUPER_ADMIN"
                  ? "/admin"
                  : userRole === "CASHIER"
                  ? "/super"
                  : userRole === "MANAGER"
                  ? "/quinc"
                  : "/login"
              }
              onClick={close}
              className="flex items-center gap-3"
            >
              <img
                src="/img/logo.png"
                alt="SP SERVICES Logo"
                className="h-10 w-auto object-contain rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter text-foreground leading-none">
                  SP SERVICES
                </span> 

              </div>
              {/* Close button for mobile */}
              <div className="flex sm:hidden items-end justify-between px-2.5 mb-2">

                <button onClick={close} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </Link>


          </div>


          {/* Navigation links */}
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link, idx) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={close}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all select-none cursor-pointer ${isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span className={isActive ? "text-primary" : "text-zinc-400"}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            
          </nav>
        </div>

        {/* Pied de page Sidebar (Déconnexion) */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              close();
              setShowLogoutConfirm(true);
            }}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* 📱 2. BOTTOM NAVIGATION BAR (Exclusif Mobile - Style App Native) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800/80 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <nav className="flex items-center justify-between w-full max-w-md mx-auto px-1">
          {/* Rendu des liens favoris avec des Noms Courts */}
          {bottomNavLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`bottom-${idx}`}
                href={link.href}
                onClick={close}
                className={`flex flex-col items-center justify-center gap-1 py-1 flex-1 transition-all ${
                  isActive ? "text-primary font-black scale-105" : "text-zinc-400 dark:text-zinc-500 font-medium"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-inherit"}`}>
                  {link.icon}
                </div>
                <span className="text-[10px] tracking-tight text-center truncate max-w-[65px]">
                  {link.shortLabel || link.label}
                </span>
              </Link>
            );
          })}

          {/* Bouton "Plus / Menu Burger" pour déplier les autres options de la sidebar sur mobile */}
          <button
            onClick={toggle}
            className={`flex flex-col items-center justify-center gap-1 py-1 flex-1 transition-all ${
              isOpen ? "text-primary font-black scale-105" : "text-zinc-400 dark:text-zinc-500 font-medium"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isOpen ? "bg-primary/10 text-primary" : "text-inherit"}`}>
              <Menu className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight text-center">Plus</span>
          </button>
        </nav>
      </div>

      {/* Fenêtre de confirmation pour la déconnexion */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter de votre session ?"
        confirmLabel="Se déconnecter"
      />
    </>
  );
}