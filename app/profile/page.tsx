"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { User, Mail, Shield, Phone, Key } from "lucide-react";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [roleLabel, setRoleLabel] = useState("Administrateur");
  const [phone, setPhone] = useState("07 00 00 00 00");
  const [name, setName] = useState("Jean Kouadio");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole");
      const storedPhone = localStorage.getItem("userPhone");
      if (storedPhone) setPhone(storedPhone);

      if (storedRole === "admin") {
        setRoleLabel("Administrateur Général");
        setName("Jean Kouadio (Admin)");
      } else if (storedRole === "manager_super") {
        setRoleLabel("Manager - Supérette");
        setName("Awa Koné");
      } else if (storedRole === "manager_gaz") {
        setRoleLabel("Manager - Gaz & Livraisons");
        setName("Koffi N'Guessan");
      } else if (storedRole === "manager_quinc") {
        setRoleLabel("Manager - Quincaillerie");
        setName("Mamadou Sylla");
      }
    }
  }, []);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    showToast("Mot de passe mis à jour avec succès !", "success");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <AppLayout title="Mon Profil" subtitle="Détails de votre compte utilisateur">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-4xl">
        {/* Info Card */}
        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-5">
          <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            Informations du compte
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <Shield className="h-5 w-5" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-400 font-semibold leading-none">Rôle</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{roleLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <span className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <User className="h-5 w-5" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-400 font-semibold leading-none">Nom complet</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <span className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                <Phone className="h-5 w-5" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-400 font-semibold leading-none">Numéro de téléphone</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{phone}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-4">
          <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-500" />
            Sécurité & Mot de passe
          </h3>

          <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground opacity-90">
                Ancien mot de passe
              </label>
              <input
                type="password"
                placeholder="Ex: 1234"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground opacity-90">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                placeholder="Nouveau PIN"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="mt-1 font-black text-sm tracking-tight">
              Mettre à jour
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
