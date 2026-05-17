import axiosInstance from "../core/axios";

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

const AuditLogService = {
  async getAll(params?: { page?: number; limit?: number; shopId?: string; userId?: string }) {
    const response = await axiosInstance.get("/audit-logs", { params });
    // Keep it safe in case it returns an array directly or paginated data structure
    return response.data;
  },

  async getById(id: string): Promise<AuditLog> {
    const response = await axiosInstance.get(`/audit-logs/${id}`);
    return response.data;
  }
};

export default AuditLogService;
