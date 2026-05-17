"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Lock, Eye, EyeOff, Phone, AlertCircle } from "lucide-react";

/**
 * ============================================================================
 * PAGE DE CONNEXION
 * ============================================================================
 * 
 * Flux d'authentification :
 *   1. L'utilisateur saisit son téléphone et son mot de passe
 *   2. Le front envoie POST /api/v1/auth/login { phone, password }
 *   3. Le backend :
 *      a. Cherche l'utilisateur par numéro de téléphone (recherche EXACTE)
 *      b. Compare le mot de passe avec le hash bcrypt en DB
 *      c. Génère un accessToken (15min) et un refreshToken (7j)
 *      d. Retourne { user, token: { accessToken, refreshToken } }
 *   4. Le front stocke le token dans Cookies + localStorage
 *   5. Redirection automatique selon le rôle
 * 
 * ⚠️ IMPORTANT :
 *   - Le téléphone est envoyé TEL QUEL au backend (pas de préfixe +225)
 *   - Le champ "password" du login = le "passwordHash" envoyé au register
 *   - Le PIN (4 chiffres) N'EST PAS utilisé pour le login
 * 
 * @see back-spservice/src/modules/auth/controllers/auth.controller.ts
 * ============================================================================
 */
export default function LoginPage() {
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone || !password) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      // Envoie le téléphone tel quel — pas de préfixe ajouté
      await login({ phone, password });
      // La redirection est gérée automatiquement dans useAuth selon le rôle
    } catch (err: any) {
      console.error("Login error:", err.message || err);
      
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;
      
      if (status === 404) {
        setError("Aucun compte trouvé avec ce numéro de téléphone.");
      } else if (status === 401) {
        setError("Mot de passe incorrect.");
      } else if (status === 400) {
        setError(Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage || "Données invalides.");
      } else {
        setError(backendMessage || "Erreur de connexion. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full flex flex-col justify-center">
        <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col gap-6">
          {/* En-tête */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight select-none">
              Identifiez-vous
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Accédez à votre espace de gestion
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Champ téléphone — envoyé tel quel au backend */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
                Numéro de téléphone
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Ex: 0701020304"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary focus:ring-primary/10 rounded-xl pl-12 pr-4 py-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Champ mot de passe — correspond au "passwordHash" du register */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
                Mot de passe
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary focus:ring-primary/10 rounded-xl pl-12 pr-12 py-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/50 dark:border-red-800/40">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <div className="flex flex-col gap-3 mt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full font-black tracking-wide"
              >
                Se connecter
              </Button>
            </div>
          </form>

          {/* Info rôles */}
          <div className="text-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Redirection automatique selon votre rôle
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
