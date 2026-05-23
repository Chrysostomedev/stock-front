/**
 * offline-queue.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * File d'attente locale pour les opérations effectuées hors-ligne.
 *
 * Architecture (conforme au README.offline.md du backend) :
 *
 *  OFFLINE : opération → stockée dans localStorage (sp_offline_queue)
 *  ONLINE  : flush() → POST /api/v1/sync-queue pour chaque item PENDING
 *            → le backend NestJS persiste dans SyncQueue (SQLite ou PG)
 *            → le CRON backend traite la queue toutes les 5 min
 *
 * Payload envoyé au backend (EnqueueSyncItemDto) :
 *  {
 *    entityType : "Sale" | "Product" | "Customer" | "Expense" | ...
 *    localId    : string  — UUID local généré côté client
 *    payload    : object  — données complètes de l'entité
 *    operation  : "CREATE" | "UPDATE" | "DELETE"
 *  }
 *
 * ⚠️  Le controller /sync-queue exige un JWT valide (ADMIN ou SUPER_ADMIN).
 *     Le token est lu depuis localStorage et injecté dans chaque requête.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "@/core/axios";

// ─────────────────────────────────────────────
// TYPES — alignés sur les DTOs backend
// ─────────────────────────────────────────────

/** Entités supportées par le dispatcher backend (ProcessSyncQueueUseCase) */
export type OfflineEntityType =
  | "Sale"
  | "Product"
  | "Customer"
  | "Expense"
  | "CashSession"
  | "StockMovement"
  | "PurchaseOrder"
  | "StockTransfer"
  | "CreditPayment";

/** Opérations CRUD — enum SyncOperation du backend */
export type OfflineOperation = "CREATE" | "UPDATE" | "DELETE";

export type OfflineItemStatus = "PENDING" | "SYNCING" | "SYNCED" | "ERROR";

export interface OfflineQueueItem {
  /** UUID local temporaire (ex: "local_1716900000000_abc") */
  id: string;
  entityType: OfflineEntityType;
  operation: OfflineOperation;
  /** Données complètes — le localId est injecté dedans ET dans le champ id */
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: OfflineItemStatus;
  lastError?: string;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const STORAGE_KEY = "sp_offline_queue";
/** Nombre max de tentatives avant de marquer ERROR (identique au backend MAX_RETRIES=5) */
const MAX_RETRIES = 5;

// ─────────────────────────────────────────────
// HELPERS INTERNES
// ─────────────────────────────────────────────

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function readQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];
  } catch {
    console.warn("[OfflineQueue] Queue corrompue — réinitialisation");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("[OfflineQueue] localStorage plein :", e);
  }
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

const OfflineQueueService = {
  /**
   * Ajoute une opération en file d'attente locale.
   *
   * @param entityType  Type d'entité backend ("Sale", "Product", etc.)
   * @param operation   "CREATE" | "UPDATE" | "DELETE"
   * @param payload     Données complètes à synchroniser
   * @returns           L'ID local généré (à utiliser comme ID optimiste dans l'UI)
   */
  enqueue(
    entityType: OfflineEntityType,
    operation: OfflineOperation,
    payload: Record<string, unknown>
  ): string {
    const queue = readQueue();
    const localId = generateLocalId();

    const item: OfflineQueueItem = {
      id: localId,
      entityType,
      operation,
      // On injecte localId dans le payload pour que le backend puisse
      // retrouver l'entité par localId lors de la sync (champ localId Prisma)
      payload: { ...payload, localId },
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "PENDING",
    };

    queue.push(item);
    writeQueue(queue);

    console.log(
      `[OfflineQueue] ➕ ${entityType}/${operation} enqueued — localId: ${localId} (total: ${queue.length})`
    );

    return localId;
  },

  /** Items en attente (PENDING ou ERROR récupérable) */
  getPending(): OfflineQueueItem[] {
    return readQueue().filter(
      (item) =>
        item.status === "PENDING" ||
        (item.status === "ERROR" && item.retryCount < MAX_RETRIES)
    );
  },

  /** Nombre d'items en attente — pour le badge UI */
  getPendingCount(): number {
    return this.getPending().length;
  },

  /** Tous les items (pour debug / écran de gestion) */
  getAll(): OfflineQueueItem[] {
    return readQueue();
  },

  /**
   * Synchronise tous les items PENDING avec le backend.
   * Les items proxy (_type: "Supplier", "Shop", etc.) sont ignorés —
   * le dispatcher backend ne supporte que les entityType natifs.
   */
  async flush(): Promise<{ total: number; succeeded: number; failed: number }> {
    const pending = this.getPending().filter((item) => {
      // Ignorer les items proxy qui ne sont pas des entityType natifs du backend
      // (Supplier, Shop, Category, Unit enqueués avec entityType: "Product")
      const isProxy = item.payload?._type &&
        !["Sale", "Product", "Customer", "Expense", "CashSession",
          "StockMovement", "PurchaseOrder", "StockTransfer", "CreditPayment"]
          .includes(item.payload._type as string);
      return !isProxy;
    });

    if (pending.length === 0) {
      return { total: 0, succeeded: 0, failed: 0 };
    }

    console.log(`[OfflineQueue] 🔄 Flush de ${pending.length} item(s)...`);

    let succeeded = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        this._updateItemStatus(item.id, "SYNCING");

        // Payload conforme à EnqueueSyncItemDto du backend
        await axiosInstance.post("/sync-queue", {
          entityType: item.entityType,
          localId: item.id,          // ← champ séparé, pas dans payload
          payload: item.payload,
          operation: item.operation,
        });

        this._updateItemStatus(item.id, "SYNCED");
        succeeded++;

        console.log(
          `[OfflineQueue] ✅ ${item.entityType}/${item.operation} → backend (${item.id})`
        );
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : "Erreur inconnue";
        this._updateItemAfterError(item.id, errorMsg);
        failed++;

        console.warn(
          `[OfflineQueue] ❌ Échec ${item.entityType}/${item.operation} : ${errorMsg}`
        );
      }
    }

    // Nettoyage des items SYNCED de plus de 7 jours
    this._cleanOldSynced();

    console.log(
      `[OfflineQueue] Flush terminé : ${succeeded} OK | ${failed} erreurs`
    );

    return { total: pending.length, succeeded, failed };
  },

  /** Supprime un item de la queue */
  remove(id: string): void {
    writeQueue(readQueue().filter((item) => item.id !== id));
  },

  /** Vide complètement la queue (⚠️ destructif) */
  clear(): void {
    writeQueue([]);
  },

  // ─────────────────────────────────────────────
  // MÉTHODES PRIVÉES
  // ─────────────────────────────────────────────

  _updateItemStatus(id: string, status: OfflineItemStatus): void {
    writeQueue(
      readQueue().map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  },

  _updateItemAfterError(id: string, errorMsg: string): void {
    writeQueue(
      readQueue().map((item) => {
        if (item.id !== id) return item;
        const newRetryCount = item.retryCount + 1;
        return {
          ...item,
          status: (newRetryCount >= MAX_RETRIES
            ? "ERROR"
            : "PENDING") as OfflineItemStatus,
          retryCount: newRetryCount,
          lastError: errorMsg,
        };
      })
    );
  },

  /** Supprime les items SYNCED de plus de 7 jours */
  _cleanOldSynced(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    writeQueue(
      readQueue().filter(
        (item) =>
          item.status !== "SYNCED" ||
          new Date(item.createdAt).getTime() > sevenDaysAgo
      )
    );
  },
};

export default OfflineQueueService;
