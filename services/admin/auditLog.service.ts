import axiosInstance from "../../core/axios";
import { withOfflineCache } from "../../core/offline-wrapper";
import { AuditLogsResponse } from "../../types/auditLog";

const AuditLogService = {
  async getLogs(page = 1, limit = 10): Promise<AuditLogsResponse> {
    return withOfflineCache(
      `audit_logs_${page}_${limit}`,
      () =>
        axiosInstance
          .get(`/audit-logs`, { params: { page, limit } })
          .then((r) => r.data),
      { data: [], total: 0, totalPages: 0, page, limit }
    );
  },
};

export default AuditLogService;
