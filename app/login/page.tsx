"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layouts/Navbar";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      await login({ username, password });
      // La redirection est gérée dans le hook useAuth
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Identifiants invalides ou erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Navbar title="SP SERVICES Stock" subtitle="Connexion sécurisée" backUrl="/" />
      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full flex flex-col justify-center">
        <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight select-none">
              Identifiez-vous
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Accédez à votre espace de gestion
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Username input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
                Nom d'utilisateur ou Téléphone
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Ex: admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-primary focus:ring-primary/10 rounded-xl pl-12 pr-4 py-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
                Mot de passe (PIN)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ex: 1234"
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

            {/* Error message */}
            {error && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/50 dark:border-red-800/40">
                {error}
              </span>
            )}

            {/* Login CTA */}
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

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  // Simulation d'un login admin pour le test UI
                  setTimeout(() => {
                    localStorage.setItem("token", "demo-token");
                    localStorage.setItem("userRole", "admin");
                    document.cookie = "token=demo-token; path=/";
                    document.cookie = "userRole=admin; path=/";
                    window.location.href = "/admin";
                  }, 800);
                }}
                className="text-xs font-bold text-zinc-400 hover:text-primary transition-colors py-2"
              >
                Accéder en Mode Démo (Test UI uniquement)
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
