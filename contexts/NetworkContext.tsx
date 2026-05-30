"use client";

/**
 * NetworkContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Contexte global réseau — conforme au README.offline.md du backend.
 *
 * Endpoints backend utilisés :
 *  POST /api/v1/sync-queue          → enqueue un item (EnqueueSyncItemDto)
 *  POST /api/v1/sync-queue/process  → déclenche le traitement du batch
 *  POST /api/v1/sync-queue/retry    → relance les items en erreur
 *  GET  /api/v1/sync-queue/stats    → statistiques de la queue
 *  PATCH /api/v1/sync-queue/:id/resolve → résolution de conflit
 *
 * Tous ces appels nécessitent un JWT valide (ADMIN ou SUPER_ADMIN).
 * Le token est injecté automatiquement par l'intercepteur axios.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNetwork } from "@/hooks/useNetwork";
import OfflineQueueService, {
  OfflineEntityType,
  OfflineOperation,
} from "@/services/offline-queue.service";
import axiosInstance from "@/core/axios";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

/** Statistiques de la SyncQueue backend */
export interface SyncQueueStats {
  pending: number;
  synced: number;
  conflict: number;
  error: number;
  total: number;
}

/** Stratégies de résolution de conflit (ConflictResolutionStrategy backend) */
export type ConflictResolutionStrategy =
  | "KEEP_LOCAL"
  | "KEEP_SERVER"
  | "MERGE";

interface NetworkContextType {
  isOnline: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
  /** Nombre d'items locaux en attente de flush vers le backend */
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  /** Statistiques de la SyncQueue côté backend (null si offline) */
  backendStats: SyncQueueStats | null;
  /** Déclenche le flush local + traitement backend */
  triggerSync: () => Promise<void>;
  /** Ajoute une opération à la queue locale */
  enqueueOperation: (
    entityType: OfflineEntityType,
    operation: OfflineOperation,
    payload: Record<string, unknown>
  ) => string;
  /**
   * Résout un conflit de synchronisation côté backend.
   * @param itemId    UUID de l'item en conflit (backend)
   * @param strategy  "KEEP_LOCAL" | "KEEP_SERVER" | "MERGE"
   * @param mergedPayload  Requis si strategy = "MERGE"
   */
  resolveConflict: (
    itemId: string,
    strategy: ConflictResolutionStrategy,
    mergedPayload?: Record<string, unknown>
  ) => Promise<void>;
}

// ─────────────────────────────────────────────
// CONTEXTE
// ─────────────────────────────────────────────

const NetworkContext = createContext<NetworkContextType | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, connectionType } = useNetwork();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [backendStats, setBackendStats] = useState<SyncQueueStats | null>(null);

  const syncLock = useRef<boolean>(false);

  // ─────────────────────────────────────────────
  // Rafraîchit le compteur local
  // ─────────────────────────────────────────────
  const refreshPendingCount = useCallback(() => {
    setPendingCount(OfflineQueueService.getPendingCount());
  }, []);

  // ─────────────────────────────────────────────
  // Récupère les stats de la SyncQueue backend
  // Timeout court (3s) pour ne pas bloquer le rendu sur Electron/mobile
  // ─────────────────────────────────────────────
  const fetchBackendStats = useCallback(async () => {
    if (!isOnline) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s max
      const response = await axiosInstance.get<SyncQueueStats>(
        "/sync-queue/stats",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      setBackendStats(response.data);
    } catch {
      // Silencieux — timeout, rôle insuffisant, ou offline
      setBackendStats(null);
    }
  }, [isOnline]);

  // ─────────────────────────────────────────────
  // Synchronisation complète :
  //  1. Flush la queue locale → POST /sync-queue (enqueue chaque item)
  //  2. Déclenche le traitement → POST /sync-queue/process
  //  3. Rafraîchit les stats backend
  // ─────────────────────────────────────────────
  const triggerSync = useCallback(async (): Promise<void> => {
    if (syncLock.current || !isOnline) return;
    syncLock.current = true;
    setIsSyncing(true);

    try {
      // Étape 1 : envoyer les items locaux au backend
      const flushResult = await OfflineQueueService.flush();

      if (flushResult.total > 0) {
        console.log(
          `[NetworkContext] Flush : ${flushResult.succeeded}/${flushResult.total} OK`
        );
      }

      // Étape 2 : déclencher le traitement du batch côté backend
      // POST /api/v1/sync-queue/process (traite 50 items PENDING)
      try {
        const processResponse = await axiosInstance.post<{
          processed: number;
          succeeded: number;
          failed: number;
          conflicts: number;
        }>("/sync-queue/process");

        const result = processResponse.data;
        if (result.processed > 0) {
          console.log(
            `[NetworkContext] Backend process : ${result.succeeded}/${result.processed} OK | ${result.conflicts} conflits`
          );
        }

        // Si des items sont en erreur, déclencher un retry automatique
        if (result.failed > 0) {
          await axiosInstance.post("/sync-queue/retry");
          console.log("[NetworkContext] Retry automatique déclenché");
        }
      } catch (processError) {
        // L'utilisateur n'est peut-être pas ADMIN → on ignore silencieusement
        console.warn(
          "[NetworkContext] /sync-queue/process inaccessible (rôle insuffisant ?)"
        );
      }

      setLastSyncAt(new Date());
      await fetchBackendStats();
    } catch (error) {
      console.warn("[NetworkContext] Erreur sync :", error);
    } finally {
      refreshPendingCount();
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [isOnline, fetchBackendStats, refreshPendingCount]);

  // ─────────────────────────────────────────────
  // Ajoute une opération à la queue locale
  // ─────────────────────────────────────────────
  const enqueueOperation = useCallback(
    (
      entityType: OfflineEntityType,
      operation: OfflineOperation,
      payload: Record<string, unknown>
    ): string => {
      const localId = OfflineQueueService.enqueue(entityType, operation, payload);
      refreshPendingCount();
      return localId;
    },
    [refreshPendingCount]
  );

  // ─────────────────────────────────────────────
  // Résolution de conflit
  // PATCH /api/v1/sync-queue/:id/resolve
  // ─────────────────────────────────────────────
  const resolveConflict = useCallback(
    async (
      itemId: string,
      strategy: ConflictResolutionStrategy,
      mergedPayload?: Record<string, unknown>
    ): Promise<void> => {
      await axiosInstance.patch(`/sync-queue/${itemId}/resolve`, {
        strategy,
        ...(mergedPayload ? { mergedPayload } : {}),
      });
      await fetchBackendStats();
      console.log(
        `[NetworkContext] Conflit résolu : ${itemId} → ${strategy}`
      );
    },
    [fetchBackendStats]
  );

  // ─────────────────────────────────────────────
  // Sync automatique au retour en ligne
  // ─────────────────────────────────────────────
  const prevIsOnline = useRef<boolean>(isOnline);

  useEffect(() => {
    if (isOnline && !prevIsOnline.current) {
      console.log("[NetworkContext] 🔄 Retour en ligne — sync dans 1.5s");
      const timer = setTimeout(() => triggerSync(), 1500);
      return () => clearTimeout(timer);
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, triggerSync]);

  // ─────────────────────────────────────────────
  // Initialisation au montage
  // On ne fetch PAS les stats backend ici — le token n'est pas encore
  // disponible au montage (timing hydration). Les stats seront chargées
  // lors du premier triggerSync() déclenché après connexion.
  // ─────────────────────────────────────────────
  useEffect(() => {
    refreshPendingCount();
    // fetchBackendStats() intentionnellement absent ici — évite le 401 au démarrage
  }, [refreshPendingCount]);

  // ─────────────────────────────────────────────
  // Sync périodique toutes les 10 min si online
  // (complément du CRON backend toutes les 5 min)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      const pending = OfflineQueueService.getPendingCount();
      if (pending > 0) {
        console.log(
          `[NetworkContext] ⏰ Sync périodique — ${pending} item(s) en attente`
        );
        triggerSync();
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, triggerSync]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        connectionType,
        pendingCount,
        isSyncing,
        lastSyncAt,
        backendStats,
        triggerSync,
        enqueueOperation,
        resolveConflict,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useNetworkContext(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error(
      "useNetworkContext doit être utilisé dans un NetworkProvider"
    );
  }
  return context;
}
