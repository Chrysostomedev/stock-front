"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./context/useContext";

const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN: "/super",
  ADMIN: "/admin",
  CASHIER: "/caisse",
};
export default function Home() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone.trim()) {
      setError("Le numéro de téléphone est requis.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Le mot de passe est requis.");
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      try {
        const res = await login(phone, password);
        const role = res.user.role as string;
        const route = ROLE_ROUTES[role];

        if (!route) {
          setError("Rôle non reconnu. Contactez l'administrateur.");
          setLoading(false);
          return;
        }

        router.push(route);
      } catch (err: unknown) {
        setLoading(false);
        if (err instanceof Error) {
          setError(err.message || "Erreur de connexion");
        } else {
          setError("Erreur de connexion");
        }
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full flex flex-col justify-center">
        <Card className="p-6 sm:p-8 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight select-none">
              Identifiez-vous
            </h2>
            <p className="mt-1 text-sm opacity-75">
              Accédez à votre espace de travail StockIvoire Pro
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Phone input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-foreground opacity-90">
                Téléphone (MoMo / Moov)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Ex: 07 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/10 rounded-xl pl-12 pr-4 py-3.5 text-base text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-foreground opacity-90">
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
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/10 rounded-xl pl-12 pr-12 py-3.5 text-base text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors select-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/50 dark:border-red-800/40 animate-pulse">
                {error}
              </span>
            )}

            {/* Role indicator */}
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.keys(ROLE_ROUTES).map((r) => (
                <span
                  key={r}
                  className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium border border-zinc-200 dark:border-zinc-700"
                >
                  {r === "SUPER_ADMIN"
                    ? "Super Admin"
                    : r === "ADMIN"
                      ? "Admin"
                      : "Caissier"}
                </span>
              ))}
            </div>

            {/* CTA button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-black tracking-wide"
            >
              Se connecter
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}