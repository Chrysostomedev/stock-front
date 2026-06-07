"use client";

import { useState, useRef, useEffect } from "react";
import { FileDown, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { downloadReport } from "@/services/export.service";

export interface ExportButtonProps {
  /** Endpoint relatif, ex: "/reports/sales/export" */
  endpoint: string;
  /** Query params passés à l'export. Les valeurs undefined/vides sont ignorées. */
  params: Record<string, string | undefined>;
  /** Libellé du bouton. Défaut: "Exporter" */
  label?: string;
  /** Formats proposés. Défaut: ["pdf", "xlsx"] */
  formats?: ("pdf" | "xlsx")[];
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
  /** Style visuel du bouton déclencheur */
  variant?: "outline" | "primary";
  /** Ouvre le menu vers la gauche (utile en fin de ligne) */
  alignRight?: boolean;
}

export default function ExportButton({
  endpoint,
  params,
  label = "Exporter",
  formats = ["pdf", "xlsx"],
  className = "",
  variant = "outline",
  alignRight = true,
}: ExportButtonProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<"pdf" | "xlsx" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = async (format: "pdf" | "xlsx") => {
    setLoadingFormat(format);
    setIsOpen(false);
    try {
      const date = new Date().toISOString().split("T")[0];
      const fallback = `rapport-${date}.${format}`;
      await downloadReport(endpoint, { ...params, format }, fallback);
      showToast(`Rapport ${format.toUpperCase()} téléchargé avec succès`, "success");
    } catch (err: any) {
      if (err.message?.includes("Session expirée")) return;
      showToast(err.message || "Impossible de générer le rapport, réessayez", "error");
    } finally {
      setLoadingFormat(null);
    }
  };

  const isLoading = loadingFormat !== null;

  const triggerClass = [
    "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all select-none",
    variant === "primary"
      ? "bg-primary text-white shadow-sm hover:bg-primary/90"
      : "border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* ── Bouton déclencheur ── */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen((v) => !v)}
        className={triggerClass}
        disabled={isLoading}
        title={isLoading ? "Génération en cours…" : label}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="hidden sm:inline">Génération en cours…</span>
          </>
        ) : (
          <>
            <FileDown className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {/* ── Menu déroulant ── */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[172px] ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          {formats.includes("pdf") && (
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-zinc-800 dark:text-zinc-200">Exporter en PDF</span>
            </button>
          )}
          {formats.includes("xlsx") && (
            <button
              type="button"
              onClick={() => handleExport("xlsx")}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors border-t border-zinc-100 dark:border-zinc-800"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-zinc-800 dark:text-zinc-200">Exporter en Excel</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
