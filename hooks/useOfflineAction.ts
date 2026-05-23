"use client";

/**
 * useOfflineAction.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook utilitaire pour exécuter une action API avec fallback offline.
 *
 * Principe :
 *  1. Si online  → exécute l'appel API normalement
 *  2. Si offline → met l'opération en queue locale (localStorage)
 *                  et retourne un résultat optimiste avec un ID local
 *
 * Usage dans un composant ou service :
 *
 *  const { execute, isOnline } = useOfflineAction();
 *
 *  // Créer une vente (online ou offline)
 *  const result = await execute({
 *    entityType: "Sale",
 *    operation:  "CREATE",
 *    payload:    saleData,
 *    onlineAction: () => SaleService.create(saleData),
 *    optimisticResult: { ...saleData, id: "local_pending", syncStatus: "PENDING" },
 *  });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import { useNetworkContext } from "@/contexts/NetworkContext";
import {
  OfflineEntityType,
  OfflineOperation,
} from "@/services/offline-queue.service";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface OfflineActionOptions<T> {
  /** Type d'entité Prisma concernée */
  entityType: OfflineEntityType;
  /** Type d'opération CRUD */
  operation: OfflineOperation;
  /** Données à envoyer (payload complet) */
  payload: Record<string, unknown>;
  /**
   * Fonction qui exécute l'appel API réel (online uniquement).
   * Doit retourner la réponse du serveur.
   */
  onlineAction: () => Promise<T>;
  /**
   * Résultat optimiste retourné immédiatement en mode offline.
   * Permet à l'UI de continuer sans attendre la sync.
   * Si non fourni, retourne { localId, syncStatus: "PENDING" }.
   */
  optimisticResult?: T;
}

interface OfflineActionResult<T> {
  /**
   * Exécute l'action avec fallback offline automatique.
   * @returns La réponse API (online) ou le résultat optimiste (offline)
   */
  execute: (options: OfflineActionOptions<T>) => Promise<T>;
  /** true si l'appareil est connecté */
  isOnline: boolean;
  /** Nombre d'items en attente de sync */
  pendingCount: number;
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useOfflineAction<T = unknown>(): OfflineActionResult<T> {
  const { isOnline, pendingCount, enqueueOperation } = useNetworkContext();

  const execute = useCallback(
    async (options: OfflineActionOptions<T>): Promise<T> => {
      const { entityType, operation, payload, onlineAction, optimisticResult } =
        options;

      // ── Mode ONLINE : appel API normal ──────────────────
      if (isOnline) {
        try {
          return await onlineAction();
        } catch (error: unknown) {
          // Si l'erreur est réseau (pas une erreur métier 4xx),
          // on bascule en mode offline automatiquement
          const isNetworkError =
            error instanceof Error &&
            (error.message.includes("Network Error") ||
              error.message.includes("ERR_NETWORK") ||
              error.message.includes("ECONNREFUSED") ||
              error.message.includes("timeout") ||
              error.message.includes("fetch"));

          if (isNetworkError) {
            console.warn(
              `[useOfflineAction] Erreur réseau sur ${entityType}/${operation} — bascule offline`
            );
            // Continuer vers le mode offline ci-dessous
          } else {
            // Erreur métier (400, 404, 422...) → on la propage normalement
            throw error;
          }
        }
      }

      // ── Mode OFFLINE : mise en queue locale ─────────────
      console.log(
        `[useOfflineAction] 📴 ${entityType}/${operation} mis en queue offline`
      );

      const localId = enqueueOperation(entityType, operation, payload);

      // Retourner le résultat optimiste fourni, ou un objet minimal
      if (optimisticResult !== undefined) {
        return optimisticResult;
      }

      // Résultat minimal par défaut si pas d'optimisticResult fourni
      return {
        localId,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
        ...payload,
      } as unknown as T;
    },
    [isOnline, enqueueOperation]
  );

  return { execute, isOnline, pendingCount };
}
