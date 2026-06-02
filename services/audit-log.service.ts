import axiosInstance from "../core/axios";
import { withOfflineCache } from "../core/offline-wrapper";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  shopId: string;
  dataBefore?: any;
  dataAfter?: any;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

const AuditLogService = {
  async getAll(params?: { page?: number; limit?: number; shopId?: string; userId?: string }) {
    return withOfflineCache(
      `audit_logs_${JSON.stringify(params ?? {})}`,
      () => axiosInstance.get("/audit-logs", { params }).then((r) => r.data),
      { data: [], total: 0, totalPages: 0, page: params?.page ?? 1, limit: params?.limit ?? 10 }
    );
  },

  async getById(id: string): Promise<AuditLog> {
    return withOfflineCache(
      `audit_log_${id}`,
      () => axiosInstance.get(`/audit-logs/${id}`).then((r) => r.data),
      {} as AuditLog
    );
  },
};

export default AuditLogService;
