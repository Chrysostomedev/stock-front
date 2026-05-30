/**
 * quinc/cashSession.service.ts — Sessions de caisse avec fallback offline
 */
import axiosInstance from "../../core/axios";
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { CashSession } from "../../types/quinc";

class QuincCashSessionService {
  /** Ouvrir une session de caisse. OFFLINE : enqueued. */
  async open(data: {
    shopId: string;
    userId: string;
    openingBalance: number;
    notes?: string;
  }): Promise<CashSession> {
    return withOfflineFallback({
      entityType: "CashSession",
      operation: "CREATE",
      payload: data as Record<string, unknown>,
      apiCall: () =>
        axiosInstance.post("/cash-sessions/open", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        openedAt: new Date().toISOString(),
        closedAt: null,
        syncStatus: "PENDING",
      } as unknown as CashSession,
    });
  }

  /** Fermer une session de caisse. OFFLINE : enqueued. */
  async close(
    id: string,
    data: { closingBalance: number; notes?: string }
  ): Promise<CashSession> {
    return withOfflineFallback({
      entityType: "CashSession",
      operation: "UPDATE",
      payload: { id, ...data } as Record<string, unknown>,
      apiCall: () =>
        axiosInstance
          .patch(`/cash-sessions/${id}/close`, data)
          .then((r) => r.data),
      optimisticResult: {
        id,
        ...data,
        closedAt: new Date().toISOString(),
        syncStatus: "PENDING",
      } as unknown as CashSession,
    });
  }

  /** Session active. OFFLINE : cache. */
  async getActive(shopId: string, userId: string): Promise<CashSession | null> {
    return withOfflineCache(
      `cash_session_active_${shopId}_${userId}`,
      async () => {
        const response = await axiosInstance.get(
          `/cash-sessions/active/${userId}`
        );
        const session = response.data;
        return session && typeof session === "object" && session.id
          ? session
          : null;
      },
      null
    );
  }
}

export default new QuincCashSessionService();
