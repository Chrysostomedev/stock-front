"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker enregistré avec succès:", reg.scope);
        })
        .catch((err) => {
          console.error("Erreur d'enregistrement du Service Worker:", err);
        });
    }

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install banner if not already running in standalone mode
      if (!isStandalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen to appinstalled event
    const handleAppInstalled = () => {
      console.log("L'application a été installée avec succès !");
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Réponse de l'utilisateur à l'installation: ${outcome}`);

    // We no longer need the prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // If already installed, running in standalone mode, or prompt is not visible, return null
  if (isStandalone || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[999] animate-fade-in-up">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group">
        {/* Subtle top premium line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-500" />
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 relative overflow-hidden">
            <Sparkles className="h-6 w-6 text-blue-500 absolute animate-pulse opacity-20" />
            <img src="/img/logo.png" alt="Logo SP Service" className="h-10 w-10 object-contain rounded-lg" />
          </div>
          
          <div className="flex flex-col pr-6">
            <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Installer l'application
            </h4>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Ajoutez SP Service sur votre écran d'accueil pour un accès ultra-rapide et un suivi fluide des stocks.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-1">
          <button 
            onClick={handleDismiss}
            className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors"
          >
            Plus tard
          </button>
          
          <button 
            onClick={handleInstallClick}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}
