"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { Bell, ShieldCheck, ShoppingCart, TrendingUp } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  desc: string;
  date: string;
  type: "success" | "error" | "info";
  icon: React.ReactNode;
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifs, setNotifs] = useState<Notification[]>([
    {
      id: 1,
      title: "Stock faible: Riz Maman 5kg",
      desc: "Il ne reste que 3 sacs de Riz Maman 5kg dans le stock.",
      date: "Aujourd'hui à 11:32",
      type: "info",
      icon: <ShoppingCart className="h-4.5 w-4.5 text-blue-500" />,
    },
    {
      id: 2,
      title: "Rapport financier disponible",
      desc: "Le rapport hebdomadaire du module Supérette est généré.",
      date: "Hier à 18:12",
      type: "success",
      icon: <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />,
    },
    {
      id: 3,
      title: "Nouveau Manager Ajouté",
      desc: "Awa Koné a été activée en tant que Manager.",
      date: "Le 02 mai à 14:00",
      type: "success",
      icon: <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />,
    },
  ]);

  const clearNotifications = () => {
    setNotifs([]);
    showToast("Toutes les notifications ont été effacées !", "success");
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Sidebar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
              Notifications & Alertes
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Restez informé de toutes les activités de votre établissement
            </p>
          </div>
          {notifs.length > 0 && (
            <Button onClick={clearNotifications} variant="danger" size="sm" className="text-xs font-bold">
              Effacer tout
            </Button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center rounded-2xl flex flex-col gap-3 items-center justify-center">
            <span className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full">
              <Bell className="h-6 w-6" />
            </span>
            <p className="text-xs font-bold text-zinc-400">
              Aucune notification en attente
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifs.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 p-4.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-xl"
              >
                <div className="flex items-start gap-3.5">
                  <span className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800/60 rounded-xl mt-0.5 shrink-0">
                    {n.icon}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                      {n.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal mt-0.5">
                      {n.desc}
                    </p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                      {n.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
