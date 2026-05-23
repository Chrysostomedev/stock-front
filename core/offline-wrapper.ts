/**
 * offline-wrapper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaire central pour wrapper n'importe quel appel API avec fallback offline.
 *
 * Conforme au README.offline.md du backend :
 *  - Les mutations offline sont enqueued via OfflineQueueService
 *  - Les lectures utilisent un cache localStorage (TTL 24h)
 *  - Les images offline ont des chemins relatifs → préfixés avec l'URL backend local
 *
 * Deux fonctions exportées :
 *  - withOfflineCache(key, fetcher, fallback)  → pour les GET
 *  - withOfflineFallback(options)              → pour POST/PUT/PATCH/DELETE
 * ─────────────────────────────────────────────────────────────────────────────
 */

import OfflineQueueService, {
  OfflineEntityType,
  OfflineOperation,
} from "@/services/offline-queue.service";

// ─────────────────────────────────────────────
// DÉTECTION D'ERREUR RÉSEAU
// ─────────────────────────────────────────────

/**
 * Détermine si une erreur est due à la perte de réseau
 * (et non à une erreur métier 4xx du serveur).
 *
 * Axios sans réponse (error.response === undefined) = erreur réseau.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Axios : pas de réponse = serveur injoignable
  if (typeof error === "object" && "response" in error) {
    if ((error as any).response === undefined) return true;
    // Axios code ERR_NETWORK ou ECONNABORTED
    const code = (error as any).code;
    if (code === "ERR_NETWORK" || code === "ECONNABORTED") return true;
  }

  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("network error") ||
    msg.includes("err_network") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed")
  );
}

// ─────────────────────────────────────────────
// CACHE LOCAL (GET) — TTL 24h
// ─────────────────────────────────────────────

const CACHE_PREFIX = "sp_cache_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

/** Sauvegarde en cache localStorage */
export function saveToCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage plein → on ignore
  }
}

/** Lit le cache (null si absent ou expiré) */
export function readFromCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/** Vide tout le cache (à appeler au logout) */
export function clearAllCache(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

// ─────────────────────────────────────────────
// GESTION DES IMAGES OFFLINE
// ─────────────────────────────────────────────

/**
 * Résout l'URL d'une image selon le contexte :
 *  - URL absolue (https://...) → retournée telle quelle (Cloudinary en prod)
 *  - Chemin relatif (/uploads/...) → préfixé avec l'URL du backend local
 *
 * Conforme à la section "Affichage des Images" du README.offline.md :
 * "Le serveur NestJS expose statiquement le dossier uploads/ via
 *  http://localhost:3001/uploads/"
 *
 * @param path  URL ou chemin relatif de l'image
 * @returns     URL complète utilisable dans un <img src>
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  // URL absolue → pas de transformation
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Chemin relatif → préfixer avec le backend local
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "https://back-spservice-production.up.railway.app";
  return `${backendUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─────────────────────────────────────────────
// WRAPPER POUR LES LECTURES (GET)
// ─────────────────────────────────────────────

/**
 * Exécute un appel GET avec cache automatique.
 *
 * - Online  : appel API → met en cache → retourne les données
 * - Offline : retourne le cache si disponible, sinon `fallback`
 *
 * @param cacheKey  Clé unique (ex: "products_shop123")
 * @param fetcher   Fonction qui fait l'appel API
 * @param fallback  Valeur si offline ET pas de cache (défaut: [])
 */
export async function withOfflineCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  fallback: T = [] as unknown as T
): Promise<T> {
  try {
    const data = await fetcher();
    saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      const cached = readFromCache<T>(cacheKey);
      if (cached !== null) {
        console.log(`[OfflineCache] 📦 Cache utilisé pour "${cacheKey}"`);
        return cached;
      }
      console.warn(`[OfflineCache] Pas de cache pour "${cacheKey}" — fallback`);
      return fallback;
    }
    throw error;
  }
}

// ─────────────────────────────────────────────
// WRAPPER POUR LES MUTATIONS (POST/PUT/PATCH/DELETE)
// ─────────────────────────────────────────────

interface MutationOptions<T> {
  /** Type d'entité — doit correspondre aux entityType supportés par le backend */
  entityType: OfflineEntityType;
  /** Type d'opération CRUD */
  operation: OfflineOperation;
  /** Payload complet (sera envoyé au backend dans EnqueueSyncItemDto.payload) */
  payload: Record<string, unknown>;
  /** Appel API réel */
  apiCall: () => Promise<T>;
  /**
   * Résultat optimiste retourné immédiatement en mode offline.
   * Permet à l'UI de continuer sans attendre la sync.
   */
  optimisticResult?: T;
}

/**
 * Exécute une mutation avec fallback offline automatique.
 *
 * - Online  : appel API normal → retourne la réponse serveur
 * - Offline : enqueue dans localStorage → retourne le résultat optimiste
 *
 * Le payload envoyé au backend via OfflineQueueService.flush() est conforme
 * à EnqueueSyncItemDto : { entityType, localId, payload, operation }
 */
export async function withOfflineFallback<T>(
  options: MutationOptions<T>
): Promise<T> {
  const { entityType, operation, payload, apiCall, optimisticResult } = options;

  try {
    return await apiCall();
  } catch (error) {
    if (isNetworkError(error)) {
      const localId = OfflineQueueService.enqueue(entityType, operation, payload);
      console.log(
        `[OfflineFallback] 📴 ${entityType}/${operation} enqueued — localId: ${localId}`
      );

      if (optimisticResult !== undefined) {
        return optimisticResult;
      }

      // Résultat minimal si pas d'optimisticResult fourni
      return {
        ...payload,
        id: localId,
        localId,
        syncStatus: "PENDING",
        createdAt: new Date().toISOString(),
      } as unknown as T;
    }

    // Erreur métier (400, 404, 422, 500...) → propager normalement
    throw error;
  }
}
