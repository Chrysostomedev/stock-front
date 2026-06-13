"use client";

import { useState } from "react";
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
  Truck,
  Shield,
  Menu,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserRole } from "@/types/auth";

import { useSidebar } from "@/contexts/SidebarContext";
import ConfirmModal from "../ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close, toggle } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Lazy init : lit localStorage une seule fois côté client, sans useEffect
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const pathname = usePathname();
  const router = useRouter();

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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
    { href: "/super", label: "Dashboard Super.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/caisse", label: "Caisse Super.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/produits", label: "Stocks Produits", icon: <Package className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/commandes", label: "Historique Ventes", icon: <FileText className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/perimes", label: "Pertes & Périmés", icon: <AlertCircle className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/fidelite", label: "Fidélité Clients", icon: <Users className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/depenses", label: "Dépenses Boutique", icon: <Wallet className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/transferts", label: "Transferts Stock", icon: <Layers className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/settings", label: "Paramètres Boutique", icon: <Settings className="h-5 w-5" />, roles: ["CASHIER"] },
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

  const bottomMobileLabels = ["Administration", "Transferts de Stock", "Journal d'activité"];

  const userRole = user?.role as UserRole | undefined;
  const allowedLinks = allLinks.filter((link) => userRole && link.roles.includes(userRole));
  const bottomNavLinks = allowedLinks.filter((link) => bottomMobileLabels.includes(link.label));
  const sidebarLinks = allowedLinks.filter((link) => !bottomMobileLabels.includes(link.label));

  const homeHref =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN"
      ? "/admin"
      : userRole === "CASHIER"
      ? "/super"
      : userRole === "MANAGER"
      ? "/quinc"
      : "/login";

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={close}
          className="sm:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-all"
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={[
          "fixed sm:static top-0 bottom-0 left-0 z-[70]",
          "bg-card border-r border-border",
          "flex flex-col justify-between",
          "transition-all duration-300 ease-in-out select-none overflow-hidden",
          // Largeur : réduite sur desktop si collapsed, pleine sur mobile
          collapsed ? "sm:w-[68px] w-64" : "w-64",
          // Translation mobile
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
        ].join(" ")}
      >
        {/* ── Haut : logo + navigation ──────────────────────────────── */}
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">

          {/* Logo + bouton collapse */}
          <div className={`flex items-center border-b border-border flex-shrink-0 ${collapsed ? "justify-center p-3" : "justify-between px-4 py-3"}`}>
            <Link href={homeHref} onClick={close} className="flex items-center gap-3 min-w-0">
              <img
                src="/img/logo.png"
                alt="SP SERVICES"
                className="h-9 w-9 object-contain rounded-lg flex-shrink-0"
              />
              {!collapsed && (
                <span className="text-sm font-black tracking-tighter text-foreground leading-none truncate">
                  SP SERVICES
                </span>
              )}
            </Link>

            {/* Fermer sur mobile (visible seulement quand non collapsed) */}
            {!collapsed && (
              <button
                onClick={close}
                className="sm:hidden p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Collapse/expand — desktop uniquement */}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Étendre" : "Réduire"}
              className="hidden sm:flex items-center justify-center p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-primary transition-colors flex-shrink-0"
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronLeft className="h-4 w-4" />
              }
            </button>
          </div>

          {/* Liens de navigation */}
          <nav className={`flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? "px-2" : "px-3"}`}>
            {sidebarLinks.map((link, idx) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={close}
                  title={collapsed ? link.label : undefined}
                  className={[
                    "flex items-center rounded-xl font-bold text-sm transition-all cursor-pointer",
                    collapsed ? "justify-center p-3" : "gap-3.5 px-3.5 py-3",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200",
                  ].join(" ")}
                >
                  <span className={`flex-shrink-0 ${isActive ? "text-primary" : "text-zinc-400"}`}>
                    {link.icon}
                  </span>
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Bas : déconnexion ─────────────────────────────────────── */}
        <div className={`border-t border-border flex-shrink-0 ${collapsed ? "p-2" : "p-3"}`}>
          <button
            onClick={() => { close(); setShowLogoutConfirm(true); }}
            title={collapsed ? "Déconnexion" : undefined}
            className={[
              "flex items-center rounded-xl font-bold text-sm",
              "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all w-full",
              collapsed ? "justify-center p-3" : "gap-3 px-3.5 py-3",
            ].join(" ")}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── BOTTOM NAV MOBILE ───────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800/80 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <nav className="flex items-center justify-between w-full max-w-md mx-auto px-1">
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
