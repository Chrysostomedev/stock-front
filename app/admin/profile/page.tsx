"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { UserCircle, Lock, Mail, Phone, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !newPassword) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Votre mot de passe a été mis à jour avec succès !");
      setPassword("");
      setNewPassword("");
    }, 1000);
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Sidebar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            Mon Profil
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gérez vos informations de compte Administrateur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile details */}
          <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200/50">
                  <UserCircle className="h-10 w-10" />
                </span>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                    Administrateur Général
                  </h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-lg w-max mt-1 select-none">
                    Super Admin
                  </span>
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800/60" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-bold">Contact:</span> info@stockivoire.ci
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-bold">Téléphone:</span> 07 00 00 00 00
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed mt-4">
              Connecté en tant que gestionnaire principal de l'établissement StockIvoire Pro.
            </p>
          </Card>

          {/* Password update form */}
          <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-500" />
              Modifier mon mot de passe
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Sécurisez l'accès à votre espace avec un nouveau mot de passe
            </p>

            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2 font-black text-sm tracking-tight flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4.5 w-4.5" />
                Confirmer la modification
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
