"use client";

/**
 * NetworkStatusBadge.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Composant visuel d'indicateur de statut réseau.
 *
 * Affiche dans la Navbar :
 *  🟢 "En ligne"     — connecté, aucun item en attente
 *  🟡 "Sync..."      — synchronisation en cours (spinner)
 *  🟠 "X en attente" — connecté mais items en queue
 *  🔴 "Hors ligne"   — pas de connexion
 *
 * Variantes :
 *  - "badge"   : petit badge compact pour la Navbar (défaut)
 *  - "banner"  : bannière pleine largeur pour les pages importantes
 *  - "dot"     : simple point coloré (très compact)
 *
 * Usage :
 *  import NetworkStatusBadge from "@/components/ui/NetworkStatusBadge";
 *  <NetworkStatusBadge variant="badge" />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CloudOff,
  Cloud,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNetworkContext } from "@/contexts/NetworkContext";
// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface NetworkStatusBadgeProps {
  /** Style d'affichage du badge */
  variant?: "badge" | "banner" | "dot";
  /** Afficher le bouton de sync manuelle */
  showSyncButton?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export default function NetworkStatusBadge({
  variant = "badge",
  showSyncButton = false,
  className = "",
}: NetworkStatusBadgeProps) {
  const { isOnline, pendingCount, isSyncing, lastSyncAt, triggerSync, backendStats } =
    useNetworkContext();

  // État local pour le feedback du bouton sync
  const [syncFeedback, setSyncFeedback] = useState<"idle" | "success" | "error">("idle");

  // ─────────────────────────────────────────────
  // Détermine l'état visuel selon la situation
  // ─────────────────────────────────────────────
  const getStatus = () => {
    if (isSyncing) return "syncing";
    if (!isOnline) return "offline";
    // Conflits backend → état spécial
    if (backendStats && backendStats.conflict > 0) return "conflict";
    if (pendingCount > 0) return "pending";
    return "online";
  };

  const status = getStatus();

  // Configuration visuelle par état
  const statusConfig = {
    online: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "En ligne",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      bannerBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    },
    syncing: {
      icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
      label: "Synchronisation...",
      dotColor: "bg-blue-500 animate-pulse",
      textColor: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-800",
      bannerBg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    },
    pending: {
      icon: <Cloud className="h-3.5 w-3.5" />,
      label: `${pendingCount} en attente`,
      dotColor: "bg-amber-500 animate-pulse",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-800",
      bannerBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    },
    conflict: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: `${backendStats?.conflict ?? 0} conflit(s)`,
      dotColor: "bg-orange-500 animate-pulse",
      textColor: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
      borderColor: "border-orange-200 dark:border-orange-800",
      bannerBg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    },
    offline: {
      icon: <WifiOff className="h-3.5 w-3.5" />,
      label: "Hors ligne",
      dotColor: "bg-red-500",
      textColor: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      borderColor: "border-red-200 dark:border-red-800",
      bannerBg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    },
  };

  const config = statusConfig[status];

  // ─────────────────────────────────────────────
  // Handler sync manuelle avec feedback
  // ─────────────────────────────────────────────
  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    try {
      await triggerSync();
      setSyncFeedback("success");
      setTimeout(() => setSyncFeedback("idle"), 2000);
    } catch {
      setSyncFeedback("error");
      setTimeout(() => setSyncFeedback("idle"), 2000);
    }
  };

  // ─────────────────────────────────────────────
  // VARIANTE : dot (simple point coloré)
  // ─────────────────────────────────────────────
  if (variant === "dot") {
    return (
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${config.dotColor} ${className}`}
        title={config.label}
      />
    );
  }

  // ─────────────────────────────────────────────
  // VARIANTE : banner (pleine largeur)
  // ─────────────────────────────────────────────
  if (variant === "banner") {
    // En ligne sans items en attente → ne rien afficher
    if (status === "online") return null;

    return (
      <div
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b text-sm font-medium ${config.bannerBg} ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className={`flex items-center gap-2 ${config.textColor}`}>
          {config.icon}
          <span>{config.label}</span>

          {/* Message contextuel selon l'état */}
          {status === "offline" && (
            <span className="text-xs font-normal opacity-75">
              — Les données seront synchronisées à la reconnexion
            </span>
          )}
          {status === "pending" && (
            <span className="text-xs font-normal opacity-75">
              — En attente de synchronisation avec le serveur
            </span>
          )}
          {status === "syncing" && (
            <span className="text-xs font-normal opacity-75">
              — Envoi des données au serveur...
            </span>
          )}
        </div>

        {/* Bouton sync manuelle (si online et items en attente) */}
        {showSyncButton && status === "pending" && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all
              ${config.textColor} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Synchroniser maintenant"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            Synchroniser
          </button>
        )}

        {/* Dernière sync */}
        {lastSyncAt && status !== "offline" && (
          <span className="text-xs opacity-50 hidden sm:block">
            Dernière sync : {lastSyncAt.toLocaleTimeString("fr-FR")}
          </span>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // VARIANTE : badge (défaut — pour la Navbar)
  // ─────────────────────────────────────────────
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold
        ${config.bgColor} ${config.borderColor} ${config.textColor} ${className}`}
      role="status"
      aria-live="polite"
      title={
        lastSyncAt
          ? `Dernière sync : ${lastSyncAt.toLocaleTimeString("fr-FR")}`
          : config.label
      }
    >
      {/* Icône d'état */}
      {config.icon}

      {/* Label */}
      <span className="hidden sm:inline">{config.label}</span>

      {/* Point animé pour offline */}
      {status === "offline" && (
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      )}

      {/* Bouton sync manuelle intégré au badge */}
      {showSyncButton && status === "pending" && !isSyncing && (
        <button
          onClick={handleManualSync}
          className="ml-1 hover:opacity-70 transition-opacity"
          title="Synchroniser maintenant"
          aria-label="Synchroniser maintenant"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}

      {/* Feedback visuel après sync manuelle */}
      {syncFeedback === "success" && (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      )}
      {syncFeedback === "error" && (
        <AlertCircle className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT SECONDAIRE : OfflineBanner
// Bannière dédiée à afficher en haut des pages
// quand l'app est hors ligne ou a des items en attente
// ─────────────────────────────────────────────

/**
 * OfflineBanner
 * Bannière à placer en haut d'une page pour informer l'utilisateur
 * du mode offline. Se masque automatiquement quand on est en ligne
 * sans items en attente.
 *
 * @example
 * <OfflineBanner />
 */
export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useNetworkContext();

  // Ne rien afficher si tout va bien
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div
      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium border-b
        ${
          !isOnline
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            : isSyncing
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
        }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <CloudOff className="h-4 w-4 shrink-0" />
            <span>
              Mode hors ligne — vos données sont sauvegardées localement
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            <span>Synchronisation en cours...</span>
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4 shrink-0" />
            <span>
              {pendingCount} opération{pendingCount > 1 ? "s" : ""} en attente
              de synchronisation
            </span>
          </>
        )}
      </div>

      {/* Bouton sync manuelle si online et items en attente */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={triggerSync}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold
            bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900
            border border-current/20 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          Synchroniser
        </button>
      )}
    </div>
  );
}
