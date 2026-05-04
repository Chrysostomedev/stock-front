"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Lock, User, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "manager_super" | "manager_gaz" | "manager_quinc";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone) {
      setError("Le numéro de téléphone est requis.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Le mot de passe est requis.");
      setLoading(false);
      return;
    }

    // Redirect based on selected role
    setTimeout(() => {
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", role);
        localStorage.setItem("userPhone", phone);
      }

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "manager_super") {
        router.push("/super");
      } else if (role === "manager_gaz") {
        router.push("/gaz");
      } else {
        router.push("/quinc");
      }
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      <header className="border-b border-border bg-card h-16 w-full flex items-center justify-between px-6 z-30 select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
            StockIvoire Pro
          </h1>
        </div>
      </header>
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

          {/* Role selector switches */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground opacity-90">
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "admin"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm"
                    : "border-border bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                Administrateur
              </button>
              <button
                type="button"
                onClick={() => setRole("manager_super")}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "manager_super"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm"
                    : "border-border bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                Manager Supérette
              </button>
              <button
                type="button"
                onClick={() => setRole("manager_gaz")}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "manager_gaz"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm"
                    : "border-border bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                Manager Gaz
              </button>
              <button
                type="button"
                onClick={() => setRole("manager_quinc")}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "manager_quinc"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm"
                    : "border-border bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                Manager Quinc
              </button>
            </div>
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/50 dark:border-red-800/40 animate-pulse">
                {error}
              </span>
            )}

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
