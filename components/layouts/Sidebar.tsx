"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  UserCircle,
  Users,
  LogOut,
  Layers,
  FileText,
  Package,
  Building2,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Tag,
  TrendingUp,
  Truck,
  Shield,
} from "lucide-react";
import { UserRole } from "@/types/auth";

import { useSidebar } from "@/contexts/SidebarContext";
import ConfirmModal from "../ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";

type user = UserRole;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  // Full available link list
  const allLinks = [
    { href: "/admin", label: "Administration", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/bilan", label: "Bilan Financier", icon: <TrendingUp className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/boutiques", label: "Boutiques", icon: <Building2 className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/clients", label: "Clients & Crédits", icon: <Users className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/produits", label: "Catalogue Produits", icon: <Package className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/categories", label: "Catégories", icon: <Tag className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/transferts", label: "Transferts de Stock", icon: <Layers className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/devis", label: "Bons de Commande", icon: <FileText className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/fournisseurs", label: "Fournisseurs", icon: <Truck className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/logs", label: "Journal d'activité", icon: <Shield className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },

    // Caissière Superette
    { href: "/super", label: "Dashboard Super.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/caisse", label: "Caisse Super.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/produits", label: "Stocks Produits", icon: <Package className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/commandes", label: "Historique Ventes", icon: <FileText className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/perimes", label: "Pertes & Périmés", icon: <AlertCircle className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/fidelite", label: "Fidélité Clients", icon: <Users className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/depenses", label: "Dépenses Boutique", icon: <Wallet className="h-5 w-5" />, roles: ["CASHIER"] },
    // { href: "/super/inventaire", label: "Inventaire Tournant", icon: <CheckCircle2 className="h-5 w-5" />, roles: ["CASHIER"] },
    { href: "/super/transferts", label: "Transferts Stock", icon: <Layers className="h-5 w-5" />, roles: ["CASHIER"] },

    // Gérant Quincaillerie
    { href: "/quinc", label: "Dashboard Quinc.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/caisse", label: "Caisse Quinc.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/produits", label: "Stock Matériaux", icon: <Package className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/devis", label: "Bons de Commande", icon: <FileText className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/credits", label: "Clients & Crédits", icon: <Users className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/fournisseurs", label: "Fournisseurs", icon: <Building2 className="h-5 w-5" />, roles: ["MANAGER"] },
    // { href: "/quinc/livraisons", label: "Livraisons", icon: <Layers className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/transferts", label: "Transferts Stock", icon: <Layers className="h-5 w-5" />, roles: ["MANAGER"] },
    { href: "/quinc/depenses", label: "Dépenses/Charges", icon: <Wallet className="h-5 w-5" />, roles: ["MANAGER"] },
    // { href: "/quinc/inventaire", label: "Inventaire", icon: <CheckCircle2 className="h-5 w-5" />, roles: ["MANAGER"] },

    { href: "/profile", label: "Mon Profil", icon: <UserCircle className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN", "CASHIER", "MANAGER", "AUDITOR"] },
    { href: "/admin/settings", label: "Paramètres", icon: <Settings className="h-5 w-5" />, roles: ["ADMIN", "SUPER_ADMIN"] },
  ];
  // Filter links by userRole
  const userRole = user?.role as UserRole;
  const links = allLinks.filter((link) => userRole && link.roles.includes(userRole));

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          onClick={close}
          className="sm:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-all"
        />
      )}
      {/* Sidebar Navigation */}
      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-[70] w-64 bg-card border-r border-border p-4 flex flex-col justify-between transition-all duration-300 select-none transform ${isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link href={userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "/admin" : `/${userRole === "CASHIER" ? "super" : "quinc"}`} onClick={close} className="hidden sm:flex items-center gap-2 px-2.5">
            <span className="text-xl font-black tracking-tighter text-primary">
              SP SERVICES Stock
            </span>
          </Link>
          {/* Close button for mobile */}
          <div className="flex sm:hidden items-center justify-between px-2.5 mb-2">
            <span className="text-lg font-black tracking-tighter text-primary">
              SP SERVICES
            </span>
            <button onClick={close} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Navigation links */}
          <nav className="flex flex-col gap-1">
            {links.map((link, idx) => {
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
                  <span className={isActive ? "text-primary" : "text-zinc-50"} style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Footer actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all select-none cursor-pointer w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>
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
