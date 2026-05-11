"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Flame,
  Wrench,
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
} from "lucide-react";

import ConfirmModal from "../ui/ConfirmModal";

type Role = "admin" | "caissiere" | "gerant" | "manager_gaz";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role>("admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole") as Role;
      if (storedRole) {
        setUserRole(storedRole);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Full available link list
  const allLinks = [
    { href: "/admin", label: "Administration", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/boutiques", label: "Boutiques", icon: <Building2 className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users className="h-5 w-5" />, roles: ["admin"] },

    // Caissière Superette
    { href: "/super", label: "Dashboard Super.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/caisse", label: "Caisse Super.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/produits", label: "Stocks Produits", icon: <Package className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/commandes", label: "Historique Ventes", icon: <FileText className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/perimes", label: "Pertes & Périmés", icon: <AlertCircle className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/fidelite", label: "Fidélité Clients", icon: <Users className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/depenses", label: "Dépenses Boutique", icon: <Wallet className="h-5 w-5" />, roles: ["admin", "caissiere"] },
    { href: "/super/inventaire", label: "Inventaire Tournant", icon: <CheckCircle2 className="h-5 w-5" />, roles: ["admin", "caissiere"] },

    // Gérant Quincaillerie
    { href: "/quinc", label: "Dashboard Quinc.", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/caisse", label: "Caisse Quinc.", icon: <ShoppingCart className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/produits", label: "Stock Matériaux", icon: <Package className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/devis", label: "Devis & Factures", icon: <FileText className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/credits", label: "Clients & Crédits", icon: <Users className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/fournisseurs", label: "Fournisseurs", icon: <Building2 className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/livraisons", label: "Livraisons", icon: <Layers className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/depenses", label: "Dépenses/Charges", icon: <Wallet className="h-5 w-5" />, roles: ["admin", "gerant"] },
    { href: "/quinc/inventaire", label: "Inventaire", icon: <CheckCircle2 className="h-5 w-5" />, roles: ["admin", "gerant"] },


    { href: "/profile", label: "Mon Profil", icon: <UserCircle className="h-5 w-5" />, roles: ["admin", "caissiere", "gerant", "manager_gaz"] },
    { href: "/admin/settings", label: "Paramètres", icon: <Settings className="h-5 w-5" />, roles: ["admin"] },
  ];

  // Filter links by userRole
  const links = allLinks.filter((link) => link.roles.includes(userRole));

  return (
    <>
      {/* Mobile Menu Trigger & Navbar Top Header */}
      <div className="flex sm:hidden h-16 bg-card border-b border-border px-4 items-center justify-between w-full z-40 sticky top-0 select-none transition-colors duration-300">
        <Link href={userRole === "admin" ? "/admin" : `/${userRole === "caissiere" ? "super" : "quinc"}`} className="flex items-center gap-2">
          <span className="text-base font-black tracking-tighter text-primary">
            SP SERVICES Stock
          </span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all select-none cursor-pointer"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
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
          <Link href={userRole === "admin" ? "/admin" : `/${userRole === "caissiere" ? "super" : "quinc"}`} onClick={() => setIsOpen(false)} className="hidden sm:flex items-center gap-2 px-2.5">
            <span className="text-xl font-black tracking-tighter text-primary">
              SP SERVICES Stock
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1">
            {links.map((link, idx) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
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
