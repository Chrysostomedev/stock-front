"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Store, 
  HardHat,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Wifi,
  QrCode,
  Boxes,
  Clock,
  ChevronRight,
  Receipt,
  CreditCard,
  Check
} from "lucide-react";

// Onglets pour la démo interactive
type DemoTab = "pos" | "hardware" | "analytics";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DemoTab>("pos");

  const navigateToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 overflow-x-hidden flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ── ARRIÈRE-PLAN LUMINEUX & GRILLES MODERNES ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Glow Blue (Haut Gauche) */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[140px]" />
        
        {/* Glow Cyan / Indigo (Centre) */}
        <div className="absolute top-1/4 right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[160px]" />

        {/* Glow Red / Amber (Bas Droite pour accent Quincaillerie) */}
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[180px]" />

        {/* Grille technique subtile */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />

        {/* Lignes radiales légères */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* ── BARRE DE NAVIGATION FLOTTANTE (GLASSMORPHISM) ── */}
      <header className="sticky top-2 sm:top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex justify-between items-center shadow-2xl shadow-black/40 gap-2 sm:gap-4"
        >
          {/* Logo & Marque */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" onClick={() => router.push("/")}>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 p-[1.5px] shadow-lg shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-black tracking-wider text-white flex items-center gap-1.5 truncate">
                SPSERVICES <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">PRO</span>
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-400 font-medium truncate">Gestion Commerciale & Stocks</span>
            </div>
          </div>

          {/* Navigation links - Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#preview" className="hover:text-white transition-colors">Aperçu Caisse</a>
            <a href="#metrics" className="hover:text-white transition-colors">Performance</a>
          </nav>

          {/* Bouton d'accès direct */}
          <div className="flex items-center shrink-0">
            <button
              onClick={navigateToLogin}
              className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border border-blue-400/30 whitespace-nowrap"
            >
              <span className="inline sm:hidden">Connexion</span>
              <span className="hidden sm:inline">Se Connecter</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* ── SECTION HERO ── */}
      <section className="relative z-20 pt-12 sm:pt-20 pb-10 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        
        {/* Badge d'annonce */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-800/80 border border-blue-500/30 text-blue-300 text-[11px] sm:text-xs font-semibold mb-6 shadow-inner backdrop-blur-md max-w-full text-center"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping shrink-0" />
          <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="truncate sm:overflow-visible">Plateforme Unifiée • Supérette & Quincaillerie</span>
        </motion.div>

        {/* Titre Principal accrocheur */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] text-white max-w-4xl"
        >
          Pilotez vos Stocks, Ventes & Boutiques avec{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-rose-400">
            Précision Absolue
          </span>
        </motion.h1>

        {/* Sous-titre percutant */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 sm:mt-6 text-sm sm:text-lg text-slate-300 font-medium max-w-2xl leading-relaxed"
        >
          Une solution complète conçue pour accélérer les encaissements, sécuriser les inventaires, 
          contrôler les créances et synchroniser vos dépôts en temps réel, même sans connexion Internet.
        </motion.p>

        {/* Boutons d'Action (CTAs) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none"
        >
          <button
            onClick={navigateToLogin}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 border border-blue-400/40 cursor-pointer"
          >
            <span>Accéder à l'application</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>

          <a
            href="#preview"
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <BarChart3 className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Voir la Démo Interactive</span>
          </a>
        </motion.div>

        {/* Badges de confiance & performance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold text-slate-400"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
            <span>Vitesse &lt; 50ms</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" />
            <span>Mode Hors-Ligne & Sync PWA</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400 shrink-0" />
            <span>Multi-Caisses & Rôles</span>
          </div>
        </motion.div>

      </section>

      {/* ── APERÇU INTERACTIF DU SYSTÈME (INTERACTIVE LIVE PREVIEW) ── */}
      <section id="preview" className="relative z-20 py-8 sm:py-10 px-3 sm:px-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-3.5 sm:p-7 shadow-2xl shadow-blue-950/40 overflow-hidden"
        >
          {/* En-tête du composant d'aperçu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] sm:text-xs font-mono text-slate-400 pl-2 border-l border-slate-800 truncate">
                terminal-caisse://spservices.pro/demo
              </span>
            </div>

            {/* Sélecteur d'onglet / Espace */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full gap-1">
              <button
                onClick={() => setActiveTab("pos")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "pos"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Store className="h-3.5 w-3.5 shrink-0" />
                <span>Supérette</span>
              </button>
              
              <button
                onClick={() => setActiveTab("hardware")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "hardware"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <HardHat className="h-3.5 w-3.5 shrink-0" />
                <span>Quincaillerie</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "analytics"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>Analyses & KPIs</span>
              </button>
            </div>
          </div>

          {/* Contenu dynamique de la démo */}
          <div className="pt-6">
            <AnimatePresence mode="wait">
              {activeTab === "pos" && (
                <motion.div
                  key="pos"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Colonne gauche : Panier & Scan Caisse */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2.5 text-xs text-slate-300 min-w-0">
                        <QrCode className="h-4 w-4 text-blue-400 shrink-0" />
                        <span className="font-mono truncate">Code-barres : [ 340156002488 ]</span>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                        Scanner prêt
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/40 border border-slate-800/80 overflow-hidden">
                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                            1
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Lait Demi-Écrémé 1L (Pack x6)</div>
                            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Lot: #LT-8941 • DLC: 18/11/2026</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">4 200 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 2 × 2 100</div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                            2
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Huile de Tournesol Pure 5L</div>
                            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Lot: #LT-3210 • DLC: 04/09/2027</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">7 500 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 1</div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0">
                            3
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Riz Parfumé Supérieur 25Kg</div>
                            <div className="text-[10px] sm:text-[11px] text-emerald-400 truncate">Stock restant : 42 sacs</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">18 500 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 1</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite : Total & Paiement Instantané */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-950/80 border border-blue-900/40 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Récapitulatif Ticket</span>
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Sous-total articles (4)</span>
                          <span className="text-slate-200 font-semibold">30 200 FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>TVA (0% exonérée)</span>
                          <span className="text-slate-200 font-semibold">0 FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Remise fidélité client</span>
                          <span className="text-emerald-400 font-semibold">- 200 FCFA</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-300">Net à Payer</span>
                          <span className="text-2xl font-black text-white">30 000 FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center justify-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Espèces</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span>Mobile Money</span>
                        </div>
                      </div>

                      <button
                        onClick={navigateToLogin}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Valider & Imprimer Ticket</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "hardware" && (
                <motion.div
                  key="hardware"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Colonne gauche : Commandes & Crédits clients */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2.5 text-xs text-slate-300 min-w-0">
                        <HardHat className="h-4 w-4 text-rose-400 shrink-0" />
                        <span className="font-mono truncate">Client : Entreprise BTP "Grand Ouest"</span>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                        Plafond Crédit : 500 000 FCFA
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/40 border border-slate-800/80 overflow-hidden">
                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold shrink-0">
                            FE
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Fer à Béton Ø12 (Barres 12m)</div>
                            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Emplacement : Dépôt Central B3</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">125 000 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 25 barres</div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold shrink-0">
                            CI
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Ciment CPJ 42.5 (Sacs 50Kg)</div>
                            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Emplacement : Quai de chargement</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">96 000 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 20 sacs</div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/20 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold shrink-0">
                            TU
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">Tuyau PVC Pression Ø110 PN10</div>
                            <div className="text-[10px] sm:text-[11px] text-emerald-400 truncate">Livraison partielle acceptée</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-white whitespace-nowrap">44 000 FCFA</div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">Qté: 8 longueurs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite : Risque & Bon de Commande / Bon de Livraison */}
                  <div className="rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-950/80 border border-rose-900/40 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">État de Créance & Solvabilité</span>
                      
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-rose-500/20">
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Encours actuel :</span>
                          <span className="font-bold text-rose-300">265 000 FCFA</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: "53%" }} />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">53% du plafond de sécurité utilisé</span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Total Commande courante</span>
                          <span className="text-slate-200 font-semibold">265 000 FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Acompte versé au comptant</span>
                          <span className="text-emerald-400 font-semibold">100 000 FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold border-t border-slate-800 pt-2">
                          <span className="text-white">Solde à imputer en dette</span>
                          <span className="text-rose-400">165 000 FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        onClick={navigateToLogin}
                        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Générer Bon de Livraison (BL)</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Chiffre d'Affaires du Jour</span>
                    <div className="text-2xl font-black text-white mt-1">1 428 500 <span className="text-xs font-semibold text-blue-400">FCFA</span></div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold mt-2">
                      <TrendingUp className="h-3 w-3" />
                      <span>+14.2% vs hier</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Nombre de Transactions</span>
                    <div className="text-2xl font-black text-white mt-1">184 <span className="text-xs font-semibold text-indigo-400">tickets</span></div>
                    <div className="flex items-center gap-1 text-[11px] text-blue-400 font-bold mt-2">
                      <Clock className="h-3 w-3" />
                      <span>Pic à 11h30 (32 v/h)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Créances à Recouvrer</span>
                    <div className="text-2xl font-black text-rose-400 mt-1">420 000 <span className="text-xs font-semibold text-slate-400">FCFA</span></div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold mt-2">
                      <CreditCard className="h-3 w-3" />
                      <span>3 échéances cette semaine</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Valeur Stock Consolidé</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">18.5M <span className="text-xs font-semibold text-slate-400">FCFA</span></div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold mt-2">
                      <Boxes className="h-3 w-3" />
                      <span>2 dépôts synchronisés</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ── SOLUTIONS SPÉCIALISÉES (SUPÉRETTE & QUINCAILLERIE) ── */}
      <section id="solutions" className="relative z-20 py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
            Métiers & Domaines
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-4">
            Deux Moteurs Dédiés à Votre Activité
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Des workflows précisément configurés pour répondre aux exigences quotidiennes de vos vendeurs et magasiniers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Solution 1: Supérette & Alimentation (Theme Bleu Roi) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Store className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  Supérette & Caisse
                </span>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                Commerce de Détail & Grande Surface
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mt-3">
                Fluidité totale pour les pics d’affluence en caisse. Encaissement instantané par lecteur code-barres, décompte de caisse sans écart et gestion rigoureuse des DLC.
              </p>

              <ul className="mt-6 space-y-3 text-xs font-semibold text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Caisse POS tactile & scanner code-barres douchette</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Traçabilité des lots et alertes automatiques de péremption</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Gestion des retours articles & impressions de tickets thermiques</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Clôture journalière (X et Z de caisse) infalsifiable</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <button
                onClick={navigateToLogin}
                className="w-full py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Accéder à l'espace Supérette</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Solution 2: Quincaillerie & Matériaux (Theme Rouge Cramoisi) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/40 p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <HardHat className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                  Quincaillerie & Gros
                </span>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-rose-300 transition-colors">
                Négoce, Chantiers & Matériaux
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mt-3">
                Maîtrise complète des ventes au comptoir et sur devis. Suivi des crédits clients avec blocage automatique au dépassement et traçabilité des livraisons échelonnées.
              </p>

              <ul className="mt-6 space-y-3 text-xs font-semibold text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Suivi des dettes & tableau de bord de recouvrement</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Gestion des commandes fournisseurs & livraisons partielles</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Unités multiples (mètres, barres, sacs, cartons, vrac)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Devis proforma convertibles en vente en un clic</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <button
                onClick={navigateToLogin}
                className="w-full py-3 rounded-xl bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Accéder à l'espace Quincaillerie</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 6 PILIERS DU SYSTÈME (FEATURES GRID) ── */}
      <section id="features" className="relative z-20 py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3.5 py-1 rounded-full border border-indigo-500/20">
            Fonctionnalités Avancées
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-4">
            Tout ce Dont Votre Équipe a Besoin
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Une architecture robuste créée pour sécuriser vos flux financiers et éliminer les erreurs humaines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Encaissement Haute Vitesse</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ajout instantané au panier par code-barres ou saisie prédictive. Raccourcis clavier pour les caissiers experts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Wifi className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Offline-First & Auto-Sync</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ne perdez jamais une vente lors d'une coupure internet. Les transactions sont conservées et synchronisées dès reconnexion.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Recouvrement & Risque Client</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contrôlez les limites d'endettement autorisées. Reçus d'acompte partiel et relevé de compte client exportable en PDF.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Boxes className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Transferts Inter-Dépôts</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Déplacez des articles d'un entrepôt central vers une boutique annexe avec bon de transfert et accusé de réception signé.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Rapports & Marges Brutes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualisez le bénéfice net par catégorie, le taux de rotation des produits et exportez l'inventaire valorisé vers Excel.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Permissions & Anti-Fraude</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rôles stricts (Admin, Gérant, Caissier, Magasinier). Enregistrement de chaque action avec horodatage et audit trail.
            </p>
          </div>

        </div>
      </section>

      {/* ── STATISTIQUES D'IMPACT (METRICS) ── */}
      <section id="metrics" className="relative z-20 py-8 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 p-5 sm:p-10 backdrop-blur-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">&lt; 0.2s</div>
              <div className="text-[11px] sm:text-xs text-blue-300 font-bold mt-1.5 sm:mt-2">Temps de Scan</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">100%</div>
              <div className="text-[11px] sm:text-xs text-indigo-300 font-bold mt-1.5 sm:mt-2">Disponibilité Offline</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">+35%</div>
              <div className="text-[11px] sm:text-xs text-emerald-300 font-bold mt-1.5 sm:mt-2">Vitesse en Caisse</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">0%</div>
              <div className="text-[11px] sm:text-xs text-rose-300 font-bold mt-1.5 sm:mt-2">Écart Inexpliqué</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNIÈRE D'APPEL À L'ACTION (CTA FINAL) ── */}
      <section className="relative z-20 py-10 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full text-center">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-xl sm:text-4xl font-black text-white tracking-tight leading-snug">
            Prêt à transformer la gestion de votre commerce ?
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-3 max-w-xl mx-auto leading-relaxed">
            Connectez-vous dès maintenant pour accéder à vos caisses, consulter vos stocks et suivre vos indicateurs de vente.
          </p>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <button
              onClick={navigateToLogin}
              className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer border border-blue-400/40"
            >
              <span>Se Connecter à SP Services</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </section>

      {/* ── PIED DE PAGE (FOOTER) ── */}
      <footer className="relative z-20 w-full border-t border-slate-900 bg-slate-950/80 py-6 sm:py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-black text-slate-300">SPSERVICES PRO</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} Tous droits réservés.</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Système Opérationnel</span>
            </div>
            <span className="text-slate-400">Version 2.5.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}