"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layouts/Navbar";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "manager">("manager");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Minimal validation to mimic a real experience
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

    // Success simulation
    setTimeout(() => {
      setLoading(false);
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/super");
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Navbar title="StockIvoire Pro" subtitle="Connexion sécurisée" backUrl="/" />
      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full flex flex-col justify-center">
        <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight select-none">
              Identifiez-vous
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Accédez à votre espace de travail
            </p>
          </div>

          {/* Role selector switches */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setRole("manager")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "manager"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                }`}
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "admin"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                }`}
            >
              Administrateur
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Phone/Username input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
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
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/10 rounded-xl pl-12 pr-4 py-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/10 rounded-xl pl-12 pr-12 py-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
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
              <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/50 dark:border-red-800/40 animate-pulse">
                {error}
              </span>
            )}

            {/* Login CTA */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-black tracking-wide bg-emerald-600 hover:bg-emerald-500"
            >
              Se connecter
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
