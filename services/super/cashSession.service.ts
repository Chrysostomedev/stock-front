/**
 * super/cashSession.service.ts — Sessions de caisse avec fallback offline
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE :
 *  - open()      → enqueued (CashSession/CREATE) + résultat optimiste
 *  - close()     → enqueued (CashSession/UPDATE) + résultat optimiste
 *  - getActive() → cache localStorage (TTL 24h)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import {
  CashSession,
  OpenCashSessionDto,
  CloseCashSessionDto,
} from "../../types/super";

const CashSessionService = {
  /**
   * Ouvrir une session de caisse.
   * OFFLINE : enqueued → résultat optimiste retourné immédiatement.
   * ⚠️ En mode offline, le backend local SQLite gère la contrainte 409.
   */
  async open(dto: OpenCashSessionDto): Promise<CashSession> {
    return withOfflineFallback({
      entityType: "CashSession",
      operation: "CREATE",
      payload: dto as unknown as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/cash-sessions/open", dto).then((r) => r.data),
      optimisticResult: {
        ...dto,
        id: `local_${Date.now()}`,
        openedAt: new Date().toISOString(),
        closedAt: null,
        closingBalance: null,
        expectedBalance: null,
        difference: null,
        syncStatus: "PENDING",
      } as unknown as CashSession,
    });
  },

  /**
   * Fermer une session de caisse.
   * OFFLINE : enqueued → résultat optimiste avec closedAt = maintenant.
   */
  async close(id: string, dto: CloseCashSessionDto): Promise<CashSession> {
    return withOfflineFallback({
      entityType: "CashSession",
      operation: "UPDATE",
      payload: { id, ...dto } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .patch(`/cash-sessions/${id}/close`, dto)
          .then((r) => r.data),
      optimisticResult: {
        id,
        ...dto,
        closedAt: new Date().toISOString(),
        syncStatus: "PENDING",
      } as unknown as CashSession,
    });
  },

  /**
   * Session active d'un utilisateur.
   * OFFLINE : retourne le cache si disponible, sinon null.
   */
  async getActive(userId: string): Promise<CashSession | null> {
    return withOfflineCache(
      `cash_session_active_${userId}`,
      async () => {
        const response = await axiosInstance.get(
          `/cash-sessions/active/${userId}`
        );
        const session = response.data;
        // Le backend retourne null/"" quand pas de session active
        return session && typeof session === "object" && session.id
          ? session
          : null;
      },
      null
    );
  },
};

export default CashSessionService;
