"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Package, 
  ShoppingCart, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Store, 
  HardHat,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Banknote,
  Coins
} from "lucide-react";
import Button from "@/components/ui/Button";

// Coordinates and delays for floating banknotes
const banknotes = [
  { id: 1, x: "12%", y: "22%", delay: 0, rotate: 14, scale: 1 },
  { id: 2, x: "82%", y: "18%", delay: 1.8, rotate: -22, scale: 1.15 },
  { id: 3, x: "8%", y: "68%", delay: 0.9, rotate: -12, scale: 0.95 },
  { id: 4, x: "88%", y: "76%", delay: 2.5, rotate: 28, scale: 1.05 },
  { id: 5, x: "48%", y: "82%", delay: 1.3, rotate: 8, scale: 1.0 },
];

export default function Home() {
  const router = useRouter();

  const appName = "SPSERVICES".split("");
  const tagLine = "La plateforme intelligente de gestion des stocks, ventes & boutiques.".split(" ");

  // Container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15
      }
    }
  };

  // Flying letter variants (Blue, White, Red cycle)
  const letterVariants = {
    hidden: { 
      y: 100, 
      opacity: 0,
      rotate: -20
    },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: i * 0.07,
        type: "spring" as const,
        stiffness: 110,
        damping: 10
      }
    }),
    hover: {
      y: -25,
      scale: 1.25,
      rotate: [0, -8, 8, 0],
      color: [
        "#3B82F6", // Royal Blue
        "#FFFFFF", // Pure White
        "#EF4444", // Crimson Red
        "#3B82F6"
      ],
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 12
      }
    }
  };

  // Word variants for tag line
  const wordVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  // Card hover animations (Blue & Red themed hover states)
  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 15
      }
    },
    hover: (isRed: boolean) => ({
      y: -10,
      scale: 1.015,
      boxShadow: isRed 
        ? "0 20px 40px rgba(239, 68, 68, 0.08)"
        : "0 20px 40px rgba(59, 130, 246, 0.08)",
      borderColor: isRed 
        ? "rgba(239, 68, 68, 0.4)"
        : "rgba(59, 130, 246, 0.4)",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    })
  };

  // Banknote float, trot (wobble), and bounce animation
  const banknoteVariants = {
    animate: (custom: { delay: number }) => ({
      y: [0, -18, 0], // Gentle vertical bounce
      rotate: [-6, 6, -6], // Trot/wobble rotation
      x: [0, 6, 0], // Side-to-side drift
      transition: {
        duration: 6,
        delay: custom.delay,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    })
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      
      {/* Background Animated Gradient Mesh (Blue & Red) */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{
            scale: [1, 1.18, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.12, 1],
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full bg-red-600/10 blur-[140px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-slate-800/20 blur-[100px]"
        />
        {/* Modern grid structure */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-25" />
      </div>

      {/* Floating Banknotes (Trottinent et Sautent) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {banknotes.map((bill) => (
          <motion.div
            key={bill.id}
            custom={{ delay: bill.delay }}
            variants={banknoteVariants}
            animate="animate"
            className="absolute rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/40 p-3 flex flex-col justify-between shadow-2xl shadow-slate-950/50"
            style={{
              left: bill.x,
              top: bill.y,
              width: "110px",
              height: "64px",
              scale: bill.scale,
              transform: `rotate(${bill.rotate}deg)`,
              backgroundImage: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)"
            }}
          >
            {/* Banknote design elements */}
            <div className="flex justify-between items-center w-full">
              <span className="text-[7px] font-black tracking-widest text-slate-500">10,000</span>
              <Coins className="h-2.5 w-2.5 text-amber-500/60" />
            </div>
            
            {/* Center bill emblem */}
            <div className="self-center my-0.5 flex items-center justify-center h-5 w-8 rounded bg-slate-850/50 border border-slate-700/30">
              <Banknote className="h-3 w-3 text-emerald-500/80 animate-pulse" />
            </div>

            <div className="flex justify-between items-center w-full">
              <div className="h-0.5 w-4 rounded-full bg-slate-700/40" />
              <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">SPS</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-slate-100 to-red-600 p-[1.5px] shadow-lg shadow-blue-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-slate-100 to-red-500">
            SPSERVICES
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/login")}
          className="border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 text-xs font-black tracking-wider transition-all"
        >
          Connexion
        </Button>
      </header>

      {/* Main hero page content */}
      <main className="relative z-20 flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col justify-center gap-14">
        
        {/* Center alignment stack */}
        <div className="text-center flex flex-col items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-black tracking-widest text-slate-300 uppercase"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Gestion de Vente & Stock de Nouvelle Génération</span>
          </motion.div>

          {/* S-P-S-E-R-V-I-C-E-S Flying letter header */}
          <div className="flex justify-center select-none py-2 overflow-visible">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-none flex gap-1 sm:gap-2.5">
              {appName.map((letter, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="cursor-default inline-block text-white"
                  style={{ textShadow: "0 10px 40px rgba(59, 130, 246, 0.15)" }}
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Tag line with animated words */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg text-slate-400 font-bold max-w-2xl leading-relaxed flex flex-wrap justify-center gap-x-2"
          >
            {tagLine.map((word, i) => (
              <motion.span key={i} variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
            ))}
          </motion.div>

          {/* Primary CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="mt-2"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/login")}
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-slate-100 to-red-600 text-slate-950 font-black tracking-wider px-10 py-4 shadow-2xl shadow-blue-500/10 hover:opacity-95 flex items-center gap-2 group transition-all duration-300 rounded-2xl"
            >
              <span>Accéder à l'application</span>
              <ArrowRight className="h-4 w-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Feature Grid split between Superette (Blue themed) and Quincaillerie (Red themed) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full"
        >
          {/* Card 1: Supérette (Blue Theme) */}
          <motion.div
            custom={false} // isRed = false
            variants={cardVariants}
            whileHover="hover"
            className="relative p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl flex flex-col gap-6 group overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
            
            <div className="flex justify-between items-start">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Store className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
                Supérette
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Espace Supérette
              </h3>
              <p className="text-sm text-slate-450 leading-relaxed font-semibold">
                Fluidité totale pour les transactions à fort volume. Caisse de vente code-barres, gestion de stocks par lot, alertes de péremption de produits et fidélisation client intégrée.
              </p>
            </div>

            <ul className="flex flex-col gap-2.5 text-xs font-bold text-slate-300 border-t border-slate-800/60 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" /> Enregistrement de vente instantané
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" /> Gestion des dates de péremption par lot
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" /> Historique et statistiques d'inventaire
              </li>
            </ul>
          </motion.div>

          {/* Card 2: Quincaillerie (Red Theme) */}
          <motion.div
            custom={true} // isRed = true
            variants={cardVariants}
            whileHover="hover"
            className="relative p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl flex flex-col gap-6 group overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500" />
            
            <div className="flex justify-between items-start">
              <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <HardHat className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-red-400 uppercase bg-red-500/10 px-3.5 py-1 rounded-full border border-red-500/20">
                Quincaillerie
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
                Espace Quincaillerie
              </h3>
              <p className="text-sm text-slate-450 leading-relaxed font-semibold">
                Contrôle absolu pour le commerce de gros et détail. Suivi des crédits clients avec limites de risques, bons de commande fournisseurs et suivi précis des livraisons partielles.
              </p>
            </div>

            <ul className="flex flex-col gap-2.5 text-xs font-bold text-slate-300 border-t border-slate-800/60 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-500" /> Tableau de bord de recouvrement de crédit
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-500" /> Entrées/Sorties et composants de matériaux
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-500" /> Cycle complet de commande et livraison fournisseur
              </li>
            </ul>
          </motion.div>
        </motion.div>

      </main>

      {/* Footer bar with secure badges */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-900 text-xs font-bold text-slate-500">
        <span>© {new Date().getFullYear()} SPServices Pro. Tous droits réservés.</span>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-blue-500" /> Sécurisé par chiffrement de bout en bout</span>
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-red-500 animate-pulse" /> Version v2.4.0</span>
        </div>
      </footer>
    </div>
  );
}