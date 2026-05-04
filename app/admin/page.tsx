"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "@/components/layouts/Sidebar";
import Card from "@/components/ui/Card";
import {
  Flame,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const modules = [
    {
      title: "Module Supérette",
      description: "Encaissements multi-produits, panier et suivi des stocks.",
      icon: <ShoppingCart className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />,
      href: "/super",
      color: "border-l-emerald-500",
    },
    {
      title: "Module Gaz & Livraisons",
      description: "Gestion des bouteilles, recharges et livraisons.",
      icon: <Flame className="h-7 w-7 text-orange-600 dark:text-orange-400" />,
      href: "/gaz",
      color: "border-l-orange-500",
    },
    {
      title: "Module Quincaillerie",
      description: "Gestion des articles, prix flexibles et crédits.",
      icon: <Wrench className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
      href: "/quinc",
      color: "border-l-blue-500",
    },
    {
      title: "Gestion des Rôles",
      description: "Activez et désactivez les managers ou admins.",
      icon: <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />,
      href: "/admin/roles",
      color: "border-l-purple-500",
    },
    {
      title: "Paramètres Généraux",
      description: "Mode d'affichage, politique et conditions générales.",
      icon: <Settings className="h-7 w-7 text-zinc-600 dark:text-zinc-400" />,
      href: "/admin/settings",
      color: "border-l-zinc-500",
    },
    {
      title: "Mon Profil",
      description: "Informations de compte, modification de mot de passe.",
      icon: <UserCircle className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />,
      href: "/admin/profile",
      color: "border-l-cyan-500",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Sidebar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
              Tableau de Bord
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Espace Administrateur StockIvoire Pro
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modules.map((mod, index) => (
            <Link href={mod.href} key={index} className="flex">
              <Card
                hoverable
                className={`flex-1 flex items-start gap-4 p-6 border-l-4 ${mod.color} hover:bg-white dark:hover:bg-zinc-900/60`}
              >
                <div className="flex-shrink-0 p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
                  {mod.icon}
                </div>
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center justify-between">
                      {mod.title}
                      <ArrowRight className="h-4 w-4 opacity-40" />
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
