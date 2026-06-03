/**
 * sync.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Semaine 2 — Synchronisation bidirectionnelle (Snapshot + PULL)
 *
 * Responsabilités :
 *  [7]  GET /sync/snapshot  → chargement initial de toutes les entités
 *  [8]  lastSyncTime        → horodatage persisté après chaque sync réussie
 *  [9]  GET /sync/pull      → récupérer les changements depuis lastSyncTime
 *  [10] applyChangeLocally  → CRUD dans le store local + gestion conflits PENDING
 *
 * Stockage local :
 *  - sp_sync_{EntityType}_{shopId?}  → tableau d'entités (localStorage)
 *  - sp_last_sync_time               → ISO date du dernier pull réussi
 *  - sp_snapshot_loaded_{shopId}     → flag premier chargement
 *
 * Compatibilité withOfflineCache :
 *  Les données sync'd sont aussi injectées dans les clés sp_cache_* utilisées
 *  par withOfflineCache afin que les services existants bénéficient du cache.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "@/core/axios";
import { saveToCache } from "@/core/offline-wrapper";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type SyncEntityType =
  | "Product"
  | "Customer"
  | "Category"
  | "Sale"
  | "Expense"
  | "CashSession"
  | "StockMovement"
  | "PurchaseOrder"
  | "CreditPayment"
  | "StockTransfer";

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";

export interface ChangeItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  shopId: string | null;
  payload: Record<string, unknown>;
  changedAt: string;
}

export interface PullResponse {
  since: string;
  serverTime: string;
  total: number;
  hasMore: boolean;
  nextOffset: number;
  changes: ChangeItem[];
}

export interface SnapshotEntityPage {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SnapshotResponse {
  serverTime: string;
  shopId: string;
  entities: Record<string, SnapshotEntityPage>;
}

export interface SyncResult {
  applied: number;
  skipped: number;
  errors: number;
}

// ─────────────────────────────────────────────
// CLÉS LOCALES
// ─────────────────────────────────────────────

const KEYS = {
  LAST_SYNC:           "sp_last_sync_time",
  snapshotLoaded: (shopId: string) => `sp_snapshot_loaded_${shopId}`,
  store:          (type: string, shopId?: string) =>
    shopId ? `sp_sync_${type}_${shopId}` : `sp_sync_${type}`,
} as const;

// Entités qui sont globales (pas liées à un shopId)
const GLOBAL_ENTITIES = new Set(["Customer"]);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function ls(): Storage | null {
  return typeof window !== "undefined" ? localStorage : null;
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = ls()?.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]): void {
  try {
    ls()?.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Sync] localStorage plein — impossible d'écrire ${key}:`, e);
  }
}

function getUserShopId(): string | null {
  try {
    const raw = ls()?.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return (
      user?.shopId ||
      user?.shopAccesses?.[0]?.shopId ||
      null
    );
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

const SyncService = {

  // ══════════════════════════════════════════
  // [8] Gestion du lastSyncTime
  // ══════════════════════════════════════════

  getLastSyncTime(): string | null {
    return ls()?.getItem(KEYS.LAST_SYNC) ?? null;
  },

  setLastSyncTime(isoDate: string): void {
    ls()?.setItem(KEYS.LAST_SYNC, isoDate);
  },

  isSnapshotLoaded(shopId: string): boolean {
    return ls()?.getItem(KEYS.snapshotLoaded(shopId)) === "true";
  },

  markSnapshotLoaded(shopId: string): void {
    ls()?.setItem(KEYS.snapshotLoaded(shopId), "true");
  },

  resetSnapshot(shopId: string): void {
    ls()?.removeItem(KEYS.snapshotLoaded(shopId));
    ls()?.removeItem(KEYS.LAST_SYNC);
  },

  // ══════════════════════════════════════════
  // [7] GET /sync/snapshot — chargement initial
  // ══════════════════════════════════════════

  /**
   * Charge toutes les entités depuis le serveur (paginé).
   * À appeler uniquement au premier démarrage ou après reset.
   *
   * @param shopId  ID de la boutique courante
   * @param onProgress  Callback progression (entité, page, total)
   */
  async loadSnapshot(
    shopId: string,
    onProgress?: (entity: string, current: number, total: number) => void
  ): Promise<void> {
    const ENTITIES = "products,customers,categories";
    const PAGE_SIZE = 100;

    console.log(`[Sync] Début snapshot pour boutique ${shopId}`);

    try {
      // Première page — récupère la structure complète
      const firstRes = await axiosInstance.get<SnapshotResponse>("/sync/snapshot", {
        params: { shopId, entities: ENTITIES, page: 1, limit: PAGE_SIZE },
      });

      const { serverTime, entities } = firstRes.data;

      for (const [entityKey, entityData] of Object.entries(entities)) {
        const { data: firstPageData, totalPages, total } = entityData;

        // Accumuler toutes les pages
        let allData = [...firstPageData];

        onProgress?.(entityKey, 1, totalPages);

        for (let page = 2; page <= totalPages; page++) {
          const pageRes = await axiosInstance.get<SnapshotResponse>("/sync/snapshot", {
            params: { shopId, entities: entityKey, page, limit: PAGE_SIZE },
          });
          const pageData = pageRes.data.entities[entityKey]?.data ?? [];
          allData = [...allData, ...pageData];
          onProgress?.(entityKey, page, totalPages);
        }

        // Stocker dans le local store
        const isGlobal = GLOBAL_ENTITIES.has(entityKey.replace(/s$/, "")) ||
                         GLOBAL_ENTITIES.has(entityKey);
        const storeKeyName = KEYS.store(entityKey, isGlobal ? undefined : shopId);
        writeLocal(storeKeyName, allData);

        // Injecter dans withOfflineCache pour compatibilité services existants
        saveToCache(`${entityKey}_${shopId}`, allData);

        console.log(`[Sync] ${entityKey}: ${total} enregistrements chargés`);
      }

      // Marquer le snapshot comme chargé et sauvegarder le serverTime
      this.markSnapshotLoaded(shopId);
      this.setLastSyncTime(serverTime);

      console.log(`[Sync] Snapshot terminé → lastSyncTime: ${serverTime}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[Sync] Erreur snapshot:", msg);
      throw error;
    }
  },

  // ══════════════════════════════════════════
  // [9] GET /sync/pull — récupérer les changements
  // ══════════════════════════════════════════

  /**
   * Récupère et applique les changements depuis lastSyncTime.
   * Gère la pagination automatiquement.
   *
   * @returns nombre de changements appliqués
   */
  async pullChanges(shopId: string): Promise<SyncResult> {
    const since = this.getLastSyncTime();
    if (!since) {
      console.warn("[Sync] Pas de lastSyncTime — snapshot requis d'abord");
      return { applied: 0, skipped: 0, errors: 0 };
    }

    let offset = 0;
    let hasMore = true;
    const result: SyncResult = { applied: 0, skipped: 0, errors: 0 };
    let latestServerTime: string | null = null;

    console.log(`[Sync] PULL depuis ${since}`);

    while (hasMore) {
      const res = await axiosInstance.get<PullResponse>("/sync/pull", {
        params: { since, shopId, limit: 200, offset },
      });

      for (const change of res.data.changes) {
        try {
          const applied = this.applyChangeLocally(change);
          if (applied) result.applied++;
          else result.skipped++;
        } catch (e) {
          result.errors++;
          console.warn(
            `[Sync] Erreur application ${change.entityType}:${change.entityId}:`,
            e
          );
        }
      }

      hasMore = res.data.hasMore;
      offset  = res.data.nextOffset;

      if (!hasMore) {
        latestServerTime = res.data.serverTime;
      }
    }

    // ⚠️ Toujours utiliser serverTime (pas since) pour éviter les trous
    if (latestServerTime) {
      this.setLastSyncTime(latestServerTime);
    }

    console.log(
      `[Sync] PULL terminé : ${result.applied} appliqués, ${result.skipped} ignorés, ${result.errors} erreurs`
    );

    return result;
  },

  // ══════════════════════════════════════════
  // [10] applyChangeLocally — CRUD + conflits PENDING
  // ══════════════════════════════════════════

  /**
   * Applique un changement serveur dans le store local.
   *
   * Gestion des conflits :
   *  - Si l'entité est en attente de sync locale (syncStatus PENDING)
   *    → on NE REMPLACE PAS (la version locale est prioritaire)
   *  - Pour les autres cas → serveur gagne (last-write-wins)
   *
   * @returns true si le changement a été appliqué, false si ignoré (conflit)
   */
  applyChangeLocally(change: ChangeItem): boolean {
    const { entityType, entityId, operation, payload, shopId } = change;

    const isGlobal = GLOBAL_ENTITIES.has(entityType);
    const effectiveShopId = isGlobal ? undefined : (shopId ?? getUserShopId() ?? undefined);
    const key = KEYS.store(entityType, effectiveShopId);

    const existing = readLocal<Record<string, unknown>>(key);

    switch (operation) {
      case "CREATE": {
        // Idempotence : ne pas dupliquer
        if (existing.some((e) => e.id === entityId)) {
          return false;
        }
        writeLocal(key, [...existing, { ...payload, syncStatus: "SYNCED" }]);
        // Mise à jour du cache withOfflineCache
        if (effectiveShopId) {
          saveToCache(`${entityType.toLowerCase()}s_${effectiveShopId}`, [
            ...existing,
            { ...payload, syncStatus: "SYNCED" },
          ]);
        }
        return true;
      }

      case "UPDATE": {
        const idx = existing.findIndex((e) => e.id === entityId);

        if (idx === -1) {
          // L'entité n'existe pas localement → la créer
          const updated = [...existing, { ...payload, syncStatus: "SYNCED" }];
          writeLocal(key, updated);
          if (effectiveShopId) {
            saveToCache(`${entityType.toLowerCase()}s_${effectiveShopId}`, updated);
          }
          return true;
        }

        const local = existing[idx];

        // Conflit : entité modifiée localement mais pas encore sync'd
        if (local.syncStatus === "PENDING") {
          console.warn(
            `[Sync] Conflit ignoré ${entityType}:${entityId} — modif locale en attente`
          );
          return false;
        }

        // Serveur gagne
        const updated = [
          ...existing.slice(0, idx),
          { ...payload, syncStatus: "SYNCED" },
          ...existing.slice(idx + 1),
        ];
        writeLocal(key, updated);
        if (effectiveShopId) {
          saveToCache(`${entityType.toLowerCase()}s_${effectiveShopId}`, updated);
        }
        return true;
      }

      case "DELETE": {
        // Soft delete : marquer inactif plutôt que supprimer
        const updated = existing.map((e) =>
          e.id === entityId
            ? { ...e, isActive: false, deletedAt: new Date().toISOString() }
            : e
        );
        writeLocal(key, updated);
        if (effectiveShopId) {
          saveToCache(`${entityType.toLowerCase()}s_${effectiveShopId}`, updated);
        }
        return true;
      }
    }
  },

  // ══════════════════════════════════════════
  // Lecture du store local (pour les composants)
  // ══════════════════════════════════════════

  getLocalProducts(shopId: string): Record<string, unknown>[] {
    return readLocal(KEYS.store("Product", shopId));
  },

  getLocalCustomers(): Record<string, unknown>[] {
    return readLocal(KEYS.store("Customer"));
  },

  getLocalCategories(shopId: string): Record<string, unknown>[] {
    return readLocal(KEYS.store("Category", shopId));
  },

  /** Vide tout le store local (⚠️ destructif — utilisé en cas de reset complet) */
  clearAllLocalData(shopId: string): void {
    const ls_ = ls();
    if (!ls_) return;
    const prefix = "sp_sync_";
    Object.keys(ls_)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => ls_!.removeItem(k));
    this.resetSnapshot(shopId);
    console.log("[Sync] Store local vidé");
  },
};

export default SyncService;
