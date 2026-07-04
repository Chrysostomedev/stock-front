/**
 * quinc/sale.service.ts — Ventes quincaillerie avec fallback offline
 */
import axiosInstance from "../../core/axios";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- withOfflineFallback conservé pour réactivation rapide de l'offline (voir create())
import { withOfflineFallback, withOfflineCache } from "../../core/offline-wrapper";
import { Sale } from "../../types/quinc";

class QuincSaleService {
  /**
   * Créer une vente.
   * OFFLINE DÉSACTIVÉ : la vente nécessite une connexion active.
   * Pour réactiver le fallback offline, décommentez le bloc ci-dessous
   * et supprimez/commentez le bloc "ONLINE ONLY" qui suit.
   */
  async create(data: Partial<Sale>): Promise<Sale> {
    // ─── BLOC OFFLINE (désactivé) ─────────────────────────────────────────
    // return withOfflineFallback({
    //   entityType: "Sale",
    //   operation: "CREATE",
    //   payload: data as Record<string, unknown>,
    //   apiCall: () => axiosInstance.post("/sales", data).then((r) => r.data),
    //   optimisticResult: {
    //     ...data,
    //     id: `local_${Date.now()}`,
    //     receiptNumber: `SP-OFFLINE-${Date.now()}`,
    //     status: "COMPLETED",
    //     syncStatus: "PENDING",
    //     createdAt: new Date().toISOString(),
    //   } as unknown as Sale,
    // });

    // ─── ONLINE ONLY ────────────────────────────────────────────────────
    return axiosInstance.post("/sales", data).then((r) => r.data);
  }

  /** Lister les ventes. OFFLINE : cache. */
  async getAll(shopId: string, filters?: any): Promise<Sale[]> {
    return withOfflineCache(
      `quinc_sales_${shopId}_${JSON.stringify(filters ?? {})}`,
      async () => {
        const response = await axiosInstance.get("/sales", {
          params: { shopId, ...filters },
        });
        const data = response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
      },
      []
    );
  }

  /** Annuler une vente. OFFLINE : enqueued. */
  async voidSale(id: string): Promise<Sale> {
    return withOfflineFallback({
      entityType: "Sale",
      operation: "UPDATE",
      payload: { id, status: "VOIDED" },
      apiCall: () =>
        axiosInstance.patch(`/sales/${id}/void`).then((r) => r.data),
      optimisticResult: { id, status: "VOIDED", syncStatus: "PENDING" } as unknown as Sale,
    });
  }
}

export default new QuincSaleService();
