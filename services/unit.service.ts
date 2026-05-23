/**
 * unit.service.ts — Service unités avec fallback offline
 */
import axiosInstance from "../core/axios";
import { withOfflineFallback, withOfflineCache } from "../core/offline-wrapper";

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  syncStatus?: string;
}

const UnitService = {
  /** Toutes les unités. OFFLINE : cache. */
  async getAll() {
    return withOfflineCache(
      "units_all",
      () => axiosInstance.get("/units").then((r) => r.data),
      []
    );
  },

  /** Créer une unité. OFFLINE : enqueued. */
  async create(data: { name: string; abbreviation: string }) {
    return withOfflineFallback({
      entityType: "Product", // proxy — pas de type Unit dans SyncQueue
      operation: "CREATE",
      payload: { _type: "Unit", ...data },
      apiCall: () => axiosInstance.post("/units", data).then((r) => r.data),
      optimisticResult: {
        ...data,
        id: `local_${Date.now()}`,
        syncStatus: "PENDING",
      } as Unit,
    });
  },
};

export default UnitService;
