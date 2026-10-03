"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import {
  FileText,
  Printer,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Barcode,
  Camera,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Store,
  Download,
} from "lucide-react";

export default function CahierRecettePage() {
  const openPrintableDoc = () => {
    window.open("/docs/cahier-recette-client.html", "_blank");
  };

  const triggerDirectPrint = () => {
    const w = window.open("/docs/cahier-recette-client.html", "_blank");
    if (w) {
      w.onload = () => {
        w.print();
      };
    }
  };

  const modules = [
    {
      title: "Génération GS1 & Dates DLC",
      icon: Barcode,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      desc: "Générateur automatique EAN-13 (préfixe 200 + clé de contrôle) et suivi des dates de péremption.",
      route: "/admin/produits",
    },
    {
      title: "Vente Scanner Caméra & Douchette",
      icon: Camera,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "Scan caméra vidéo direct (smartphone/PC), viseur laser, torche flash, bip sonore synthétique et écoute douchette.",
      route: "/admin/caisse",
    },
    {
      title: "Inventaire Physique & Ajustement",
      icon: ClipboardList,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      desc: "Comptage physique des rayons, détection en direct des écarts (surplus/manque) et régularisation du stock.",
      route: "/admin/inventory/physique",
    },
    {
      title: "Péremptions & Mise au Rebut",
      icon: AlertTriangle,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      desc: "Alertes automatiques par code couleur et procédure de mise au rebut avec motif comptable.",
      route: "/admin/inventory/perimes",
    },
    {
      title: "Analyse des Ventes & Marges COGS",
      icon: TrendingUp,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      desc: "Calcul de la rentabilité réelle par produit : CA, coût d'achat, marge brute et taux de marge avec exports.",
      route: "/dashboard/reports/products",
    },
    {
      title: "Sélecteur Multi-Boutiques Pro",
      icon: Store,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      desc: "Résolution automatique des vrais noms de boutiques. Élimination complète des identifiants techniques UUIDs.",
      route: "/dashboard",
    },
  ];

  return (
    <AppLayout
      title="Cahier de Recette Client"
      subtitle="Documentation officielle & protocoles de test fonctionnel"
      rightElement={
        <div className="flex items-center gap-2">
          <button
            onClick={openPrintableDoc}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ouvrir la page</span>
          </button>
          <button
            onClick={triggerDirectPrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer en PDF (A4)</span>
          </button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-16">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-2xl text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Version 2.4.0 — Prête pour Validation
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Cahier de Recette & Guide de Test Client
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ce document a été spécialement conçu pour vous et vos équipes afin de
                démontrer et valider pas-à-pas que chaque fonctionnalité demandée est
                opérationnelle sur le terrain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                onClick={triggerDirectPrint}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Télécharger le PDF A4
              </button>
              <button
                onClick={openPrintableDoc}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs font-bold backdrop-blur-sm transition-all"
              >
                <FileText className="h-4 w-4" />
                Afficher le document complet
              </button>
            </div>
          </div>
        </div>

        {/* GRILLE DES CHANTIERS LIVRÉS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${m.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-1.5">
                    {m.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{m.route}</span>
                  <a
                    href={m.route}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Tester →
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* APERÇU DU DOCUMENT DANS LA PAGE */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Aperçu Intégré du Document PDF
              </span>
            </div>
            <button
              onClick={triggerDirectPrint}
              className="text-xs font-bold text-primary hover:underline"
            >
              Imprimer / Sauvegarder
            </button>
          </div>
          <div className="w-full h-[650px] bg-zinc-100 dark:bg-zinc-950">
            <iframe
              src="/docs/cahier-recette-client.html"
              className="w-full h-full border-none"
              title="Cahier de Recette Client"
            />
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
