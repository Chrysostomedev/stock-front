import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center justify-center gap-6 text-center">
        <div className="flex items-center justify-center h-16 w-16 bg-red-50 dark:bg-red-950/40 border border-red-200/40 dark:border-red-800/40 text-red-600 dark:text-red-400 rounded-2xl animate-pulse">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight select-none">
            Page introuvable
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold active:scale-98 transition-all select-none cursor-pointer w-full shadow-md shadow-emerald-500/10 mt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
