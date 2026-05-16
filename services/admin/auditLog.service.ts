import axiosInstance from "../../core/axios";
import { AuditLogsResponse } from "../../types/auditLog";

const AuditLogService = {
  async getLogs(page = 1, limit = 10): Promise<AuditLogsResponse> {
    const response = await axiosInstance.get(`/audit-logs`, {
      params: { page, limit }
    });
    return response.data;
  }
};

export default AuditLogService;
