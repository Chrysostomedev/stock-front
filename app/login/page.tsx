"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Lock,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  ShieldCheck,
  Zap,
  LogIn,
  CheckCircle2,
  Wifi,
  BarChart3,
  RefreshCw,
  Building2,
  MessageCircle,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplir le numéro si l'utilisateur avait coché "Se souvenir de moi"
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("remembered_login_phone");
      if (savedPhone) {
        setPhone(savedPhone);
      }
    }
  }, []);

  /** Nettoie les espaces, tirets et points tout en conservant le préfixe s'il est fourni */
  const normalizePhone = (raw: string): string => {
    return raw.replace(/[\s\-\.]/g, "");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone || !password) {
      setError("Veuillez renseigner votre numéro de téléphone et votre mot de passe.");
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizePhone(phone.trim());
    if (normalizedPhone.replace(/\D/g, "").length < 8) {
      setError("Numéro de téléphone invalide (au moins 8 chiffres requis).");
      setLoading(false);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem("remembered_login_phone", phone.trim());
        } else {
          localStorage.removeItem("remembered_login_phone");
        }
      }

      await login({ phone: normalizedPhone, password });
      // La redirection est gérée automatiquement dans useAuth selon le rôle
    } catch (err: any) {
      console.error("Login error:", err.message || err);

      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;

      if (status === 404) {
        setError("Aucun compte trouvé avec ce numéro de téléphone.");
      } else if (status === 401) {
        setError("Mot de passe incorrect. Veuillez vérifier votre saisie.");
      } else if (status === 400) {
        const raw = Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage || "";
        const translated = raw
          .replace(/phone must be a valid phone number/gi, "Format de numéro de téléphone invalide.")
          .replace(/password must be/gi, "Mot de passe invalide.")
          .replace(/must be a string/gi, "Champ invalide.")
          .replace(/should not be empty/gi, "Ce champ est obligatoire.");
        setError(translated || "Données de connexion invalides.");
      } else {
        setError(backendMessage || err.message || "Erreur de connexion au serveur. Vérifiez votre réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-[#003b95] selection:text-white relative overflow-hidden">
      
      {/* ── ARRIÈRE-PLAN SUBTIL ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#003b95]/20 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] bg-slate-800/40 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#003b95]/15 rounded-full blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          COLONNE GAUCHE (VITRINE CORPORATE SPSERVICE) — Desktop (lg+)
         ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        
        {/* Haut : Logo officiel SPSERVICE & Titre */}
        <div className="space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-md border border-slate-200 flex items-center justify-center shrink-0">
              <img
                src="/img/logo.png"
                alt="SPSERVICE"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight leading-none block">
                SPSERVICE
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                Plateforme de Gestion Commerciale & Stocks
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-[#003b95]" />
            <span>Terminal d&apos;encaissement multi-boutiques & inventaire</span>
          </div>
        </div>

        {/* Centre : Titre percutant & Piliers Métiers */}
        <div className="my-auto py-10 space-y-8 max-w-xl">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Gestion centralisée de vos ventes, magasins et flux financiers.
            </h1>
            <p className="text-sm xl:text-base text-slate-400 leading-relaxed font-medium">
              Une infrastructure complète et sécurisée au service des équipes de terrain, caissiers et administrateurs.
            </p>
          </div>

          {/* Cartes Métiers professionnelles */}
          <div className="grid grid-cols-1 gap-3.5">
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="p-2.5 rounded-lg bg-[#003b95]/15 text-[#3b82f6] border border-[#003b95]/30 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white mb-0.5">
                  Point de Vente Rapide & Scan Code-Barres
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Encaissement accéléré via douchette ou caméra smartphone, gestion des tickets et modes de règlement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white mb-0.5">
                  Contrôle des Stocks, DLC & Rentabilité
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comptage physique des rayons, suivi des dates de péremption, marge brute en temps réel et exports comptables.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white mb-0.5">
                  Fonctionnement Continu Hors-Ligne
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Garantie de continuité des encaissements sans interruption même en cas d&apos;indisponibilité Internet.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bas : Badge de sécurité & Crédits */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité certifiée SSL 256-bit • Authentification JWT</span>
          </div>
          <span>SPSERVICE © 2026</span>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          COLONNE DROITE (FORMULAIRE D'AUTHENTIFICATION PRO)
         ══════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 relative z-10">
        
        {/* Conteneur Formulaire */}
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo en vue mobile */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-2">
            <div className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-md border border-slate-200 flex items-center justify-center">
              <img
                src="/img/logo.png"
                alt="SPSERVICE"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-black text-white tracking-tight">SPSERVICE</span>
          </div>

          {/* En-tête professionnel sans emoji ni artifices */}
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#003b95]/20 border border-[#003b95]/40 flex items-center justify-center text-[#3b82f6]">
                <LogIn className="w-4 h-4" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Authentification
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Veuillez saisir vos identifiants pour ouvrir votre session de travail.
            </p>
          </div>

          {/* Formulaire Principal */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Champ Téléphone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Numéro de téléphone</span>
                <span className="text-[10px] text-slate-500 font-semibold normal-case">Identifiant utilisateur</span>
              </label>
              
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-2.5 border-r border-slate-700 text-slate-400 group-focus-within:text-[#3b82f6] group-focus-within:border-[#003b95] transition-colors">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-300 font-mono">+225</span>
                </div>
                
                <input
                  type="tel"
                  placeholder="07 01 02 03 04"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/25 rounded-xl pl-24 pr-4 py-3.5 text-sm text-white placeholder-slate-500 font-mono font-medium outline-none transition-all"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mot de passe
              </label>

              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors">
                  <Lock className="w-4 h-4" />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/25 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options : Se souvenir de moi */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#003b95] focus:ring-[#003b95] accent-[#003b95] cursor-pointer"
                />
                <span>Mémoriser mon numéro</span>
              </label>

              <span className="text-[11px] font-bold text-slate-500">
                Redirection automatique
              </span>
            </div>

            {/* Message d'Erreur Stylisé */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* BOUTON BLEU PUR OFFICIEL (SPSERVICE) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#003b95] hover:bg-[#002f77] active:bg-[#002660] text-white font-bold py-3.5 px-6 text-sm tracking-wide shadow-md shadow-[#003b95]/30 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>

          </form>

          {/* Assistance & Rôles */}
          <div className="pt-6 border-t border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Difficulté de connexion ?{" "}
              <a
                href="https://wa.me/2250506832678?text=Bonjour%20administrateur,%20j'ai%20besoin%20d'aide%20pour%20me%20connecter%20sur%20SPSERVICE."
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b82f6] hover:text-[#60a5fa] font-bold hover:underline inline-flex items-center gap-1.5 transition-colors"
                title="Contacter l'administrateur sur WhatsApp (05 06 83 26 78)"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Contactez l&apos;admin sur WhatsApp (05 06 83 26 78)</span>
              </a>
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Accès Caissier, Gérant, Administrateur</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
