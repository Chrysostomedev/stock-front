"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Card from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { Bell, Moon, Sun, Lock } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  const handleSetTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    showToast(`Mode ${newTheme === "light" ? "Clair" : "Sombre"} activé avec succès !`, "success");
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight leading-tight">
            Paramètres Généraux
          </h2>
          <p className="mt-1 text-sm opacity-75">
            Personnalisez votre application StockIvoire Pro
          </p>
        </div>

        {/* Display / Theme toggle */}
        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-5 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </span>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground">Apparence de l'application</h3>
              <span className="text-xs opacity-75">
                Ajustez le mode d'affichage pour votre confort visuel
              </span>
            </div>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl gap-1 max-w-xs select-none">
            <button
              onClick={() => handleSetTheme("light")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                theme === "light"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <Sun className="inline h-4 w-4 mr-1 text-amber-500" />
              Clair
            </button>
            <button
              onClick={() => handleSetTheme("dark")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                theme === "dark"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <Moon className="inline h-4 w-4 mr-1 text-blue-400" />
              Sombre
            </button>
          </div>
        </Card>

        {/* Notifications and Alerts */}
        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-5 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Bell className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground">Notifications & Alertes</h3>
              <span className="text-xs opacity-75">
                Gérez les notifications de panier, stocks bas et mouvements de caisse
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <span className="text-xs font-bold text-foreground opacity-90">
                Activer les notifications système
              </span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => {
                  setNotifications(!notifications);
                  showToast(`Notifications ${!notifications ? "activées" : "désactivées"} !`);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <span className="text-xs font-bold text-foreground opacity-90">
                Alertes sonores au comptoir (Ventes réussies)
              </span>
              <input
                type="checkbox"
                checked={sound}
                onChange={() => {
                  setSound(!sound);
                  showToast(`Alertes sonores ${!sound ? "activées" : "désactivées"} !`);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Politics and Conditions */}
        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Lock className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground">Sécurité & Confidentialité</h3>
              <span className="text-xs opacity-75">
                Données gérées localement et sauvegardées automatiquement dans le Cloud
              </span>
            </div>
          </div>

          <p className="text-xs opacity-75 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 p-4 rounded-xl">
            Toutes les transactions effectuées au comptoir (Espèces, MTN MoMo, Moov Money, Crédits) sont stockées dans nos bases sécurisées. Les managers n'ont pas accès aux configurations globales et rapports financiers généraux de l'administrateur.
          </p>
        </Card>
      </main>
    </div>
  );
}
