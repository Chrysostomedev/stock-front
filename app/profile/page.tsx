"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { 
  Phone, 
  Shield, 
  ShieldCheck, 
  Building, 
  Activity,
  ChevronRight,
  LogOut,
  Camera,
  AlertCircle,
  Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthService from "@/services/auth.service";

/**
 * ============================================================================
 * PAGE : PROFIL UTILISATEUR
 * ============================================================================
 * 
 * Permet à l'utilisateur de :
 *   1. Voir ses informations (nom, téléphone, rôle)
 *   2. Modifier son nom et téléphone
 *   3. Changer son mot de passe (le passwordHash)
 * 
 * ⚠️ Le backend n'utilise que le "passwordHash" pour l'authentification.
 *    Le PIN n'est pas utilisé pour le login, on ne l'expose pas ici.
 * 
 * Endpoint : PATCH /api/v1/auth/update/:id
 * Le backend hash automatiquement le passwordHash avec bcrypt.
 * 
 * @see back-spservice/src/modules/auth/users/application/usecases/update-user.usecase.ts
 * ============================================================================
 */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  
  // === États pour les champs éditables ===
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // === États pour le changement de mot de passe ===
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  /**
   * Mise à jour des informations personnelles (nom + téléphone).
   */
  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      await AuthService.updateUser(user.id, { name, phone });
      showToast("Informations mises à jour avec succès !", "success");
    } catch (err: any) {
      console.error("Update error:", err);
      showToast(err.response?.data?.message || "Échec de la mise à jour", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Changement du mot de passe.
   * 
   * C'est le champ "passwordHash" du backend.
   * Le backend hash automatiquement avec bcrypt via UpdateUserUseCase.
   */
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!newPassword) {
      showToast("Veuillez saisir un nouveau mot de passe", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Le backend reçoit passwordHash en clair et le hash avec bcrypt
      await AuthService.updateUser(user.id, { passwordHash: newPassword });
      showToast("Mot de passe mis à jour avec succès !", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password update error:", err);
      showToast(err.response?.data?.message || "Échec du changement de mot de passe", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : user.username ? user.username[0].toUpperCase() : "U";

  return (
    <AppLayout title="Mon Profil" subtitle="Gérez vos informations et votre sécurité">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
        
        {/* Header Profile Section */}
        <div className="relative flex flex-col items-center sm:flex-row sm:items-end gap-6 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div className="relative group shrink-0">
            <div className="h-28 w-28 rounded-3xl bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
              {initials}
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg text-zinc-600 dark:text-zinc-400 hover:text-primary transition-all">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center sm:items-start flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{user.name || user.username}</h2>
              <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "secondary" : "outline"}>
                {user.role}
              </Badge>
            </div>
            <p className="text-zinc-500 font-bold text-sm mt-1 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              {user.phone || "Aucun téléphone configuré"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={logout} variant="outline" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/30">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Formulaire infos générales */}
            <Card className="p-6">
              <h3 className="text-base font-black text-foreground mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Informations Générales
              </h3>
              
              <form onSubmit={handleInfoUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end mt-2">
                  <Button type="submit" variant="primary" loading={isUpdating}>
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </Card>

            {/* Section Admin */}
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Card className="p-6 bg-primary/[0.02] border-primary/10">
                <h3 className="text-base font-black text-foreground mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Privilèges Administrateur
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground">Accès Total</span>
                      <span className="text-[10px] text-zinc-400 font-bold">Tous les modules</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground">Multi-Boutiques</span>
                      <span className="text-[10px] text-zinc-400 font-bold">Gestion centralisée</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar — Sécurité */}
          <div className="flex flex-col gap-6">
            
            {/* Changement de Mot de Passe uniquement */}
            <Card className="p-6">
              <h3 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Mot de Passe
              </h3>
              
              <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Retapez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-600 font-bold">
                    Ce mot de passe est celui utilisé pour vous connecter.
                  </p>
                </div>

                <Button type="submit" variant="outline" className="mt-1" loading={isChangingPassword}>
                  Changer le mot de passe
                </Button>
              </form>
            </Card>

            {/* Quick Links */}
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Journal d&apos;activité</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "outline" }) {
  const variants = {
    primary: "bg-primary text-white",
    secondary: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900",
    outline: "border border-zinc-200 dark:border-zinc-800 text-zinc-500"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}
