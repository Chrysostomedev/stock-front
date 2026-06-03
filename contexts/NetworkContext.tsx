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
import SyncService from "@/services/sync.service";
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
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  /** ISO timestamp du dernier pull serveur réussi */
  lastSyncTime: string | null;
  backendStats: SyncQueueStats | null;
  /** PUSH (queue locale → serveur) */
  triggerSync: () => Promise<void>;
  /** fullSync [11] = PUSH + PULL — à appeler au retour en ligne */
  fullSync: (shopId?: string) => Promise<void>;
  enqueueOperation: (
    entityType: OfflineEntityType,
    operation: OfflineOperation,
    payload: Record<string, unknown>
  ) => string;
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
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    () => SyncService.getLastSyncTime()
  );
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
  // Helper : lit le shopId depuis le user en cache
  // ─────────────────────────────────────────────
  const getShopId = useCallback((): string | null => {
    try {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem("user")
        : null;
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.shopId || user?.shopAccesses?.[0]?.shopId || null;
    } catch {
      return null;
    }
  }, []);

  // ─────────────────────────────────────────────
  // PUSH uniquement (Semaine 1 — inchangé)
  // ─────────────────────────────────────────────
  const triggerSync = useCallback(async (): Promise<void> => {
    if (syncLock.current || !isOnline) return;
    syncLock.current = true;
    setIsSyncing(true);

    try {
      const flushResult = await OfflineQueueService.flush();
      if (flushResult.total > 0) {
        console.log(`[NetworkContext] PUSH : ${flushResult.succeeded}/${flushResult.total} OK`);
      }

      try {
        const processRes = await axiosInstance.post<{
          processed: number; succeeded: number; failed: number; conflicts: number;
        }>("/sync-queue/process");
        const r = processRes.data;
        if (r.processed > 0) {
          console.log(`[NetworkContext] Process : ${r.succeeded}/${r.processed} OK | ${r.conflicts} conflits`);
        }
        if (r.failed > 0) {
          await axiosInstance.post("/sync-queue/retry");
        }
      } catch {
        console.warn("[NetworkContext] /sync-queue/process inaccessible");
      }

      setLastSyncAt(new Date());
      await fetchBackendStats();
    } catch (error) {
      console.warn("[NetworkContext] Erreur PUSH :", error);
    } finally {
      refreshPendingCount();
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [isOnline, fetchBackendStats, refreshPendingCount]);

  // ─────────────────────────────────────────────
  // [11] fullSync = PUSH + PULL
  // Appelé au retour en ligne et toutes les 5 minutes
  // ─────────────────────────────────────────────
  const fullSync = useCallback(async (shopIdArg?: string): Promise<void> => {
    if (syncLock.current || !isOnline) return;
    syncLock.current = true;
    setIsSyncing(true);

    const shopId = shopIdArg ?? getShopId();

    try {
      // ── Étape 1 : PUSH ──────────────────────
      const flushResult = await OfflineQueueService.flush();
      if (flushResult.total > 0) {
        console.log(`[NetworkContext] fullSync PUSH : ${flushResult.succeeded}/${flushResult.total} OK`);
      }

      try {
        const processRes = await axiosInstance.post<{
          processed: number; succeeded: number; failed: number; conflicts: number;
        }>("/sync-queue/process");
        const r = processRes.data;
        if (r.processed > 0) {
          console.log(`[NetworkContext] Process : ${r.succeeded}/${r.processed} | ${r.conflicts} conflits`);
        }
        if (r.failed > 0) await axiosInstance.post("/sync-queue/retry");
      } catch {
        console.warn("[NetworkContext] /sync-queue/process inaccessible");
      }

      // ── Étape 2 : PULL ──────────────────────
      if (shopId) {
        const hasSyncTime = !!SyncService.getLastSyncTime();

        if (!hasSyncTime) {
          // Jamais synchronisé → snapshot d'abord si pas encore chargé
          if (!SyncService.isSnapshotLoaded(shopId)) {
            console.log("[NetworkContext] Snapshot initial requis avant PULL");
          } else {
            console.warn("[NetworkContext] PULL ignoré — pas de lastSyncTime (relancer le snapshot)");
          }
        } else {
          const pullResult = await SyncService.pullChanges(shopId);

          // [8] Mettre à jour le lastSyncTime affiché
          const newSyncTime = SyncService.getLastSyncTime();
          if (newSyncTime) setLastSyncTime(newSyncTime);

          console.log(
            `[NetworkContext] PULL : ${pullResult.applied} appliqués, ` +
            `${pullResult.skipped} conflits ignorés, ${pullResult.errors} erreurs`
          );
        }
      }

      setLastSyncAt(new Date());
      await fetchBackendStats();
    } catch (error) {
      console.warn("[NetworkContext] Erreur fullSync :", error);
    } finally {
      refreshPendingCount();
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [isOnline, getShopId, fetchBackendStats, refreshPendingCount]);

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
  // fullSync automatique au retour en ligne
  // ─────────────────────────────────────────────
  const prevIsOnline = useRef<boolean>(isOnline);

  useEffect(() => {
    if (isOnline && !prevIsOnline.current) {
      console.log("[NetworkContext] 🔄 Retour en ligne — fullSync dans 1.5s");
      const timer = setTimeout(() => fullSync(), 1500);
      return () => clearTimeout(timer);
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, fullSync]);

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
  // [11] fullSync périodique toutes les 5 min si online
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      const pending = OfflineQueueService.getPendingCount();
      const hasSyncTime = !!SyncService.getLastSyncTime();
      if (pending > 0 || hasSyncTime) {
        console.log("[NetworkContext] ⏰ fullSync périodique (5 min)");
        fullSync();
      }
    }, 5 * 60 * 1000); // [11] toutes les 5 minutes
    return () => clearInterval(interval);
  }, [isOnline, fullSync]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        connectionType,
        pendingCount,
        isSyncing,
        lastSyncAt,
        lastSyncTime,
        backendStats,
        triggerSync,
        fullSync,
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
