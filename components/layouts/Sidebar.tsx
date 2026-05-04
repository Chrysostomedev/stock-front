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
} from "lucide-react";

type Role = "admin" | "manager_super" | "manager_gaz" | "manager_quinc";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Full available link list
  const allLinks = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["admin"] },
    { href: "/super", label: "Supérette", icon: <ShoppingCart className="h-5 w-5" />, roles: ["admin", "manager_super"] },
    { href: "/gaz", label: "Gaz & Livraisons", icon: <Flame className="h-5 w-5" />, roles: ["admin", "manager_gaz"] },
    { href: "/quinc", label: "Quincaillerie", icon: <Wrench className="h-5 w-5" />, roles: ["admin", "manager_quinc"] },
    { href: "/admin/roles", label: "Gestion des rôles", icon: <Users className="h-5 w-5" />, roles: ["admin"] },
    { href: "/profile", label: "Profil", icon: <UserCircle className="h-5 w-5" />, roles: ["admin", "manager_super", "manager_gaz", "manager_quinc"] },
    { href: "/admin/settings", label: "Paramètres", icon: <Settings className="h-5 w-5" />, roles: ["admin", "manager_super", "manager_gaz", "manager_quinc"] },
  ];

  // Filter links by userRole
  const links = allLinks.filter((link) => link.roles.includes(userRole));

  return (
    <>
      {/* Mobile Menu Trigger & Navbar Top Header */}
      <div className="flex sm:hidden h-16 bg-card border-b border-border px-4 items-center justify-between w-full z-40 sticky top-0 select-none transition-colors duration-300">
        <Link href={userRole === "admin" ? "/admin" : `/${userRole.split("_")[1]}`} className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            StockIvoire Pro
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
          className="sm:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-all"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-40 w-64 bg-card border-r border-border p-4 flex flex-col justify-between transition-all duration-300 select-none transform ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link href={userRole === "admin" ? "/admin" : `/${userRole.split("_")[1]}`} onClick={() => setIsOpen(false)} className="hidden sm:flex items-center gap-2 px-2.5">
            <span className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              StockIvoire Pro
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
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all select-none cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all select-none cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Link>
        </div>
      </aside>
    </>
  );
}
