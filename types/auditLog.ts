export interface AuditLog {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | string;
  entityType: string;
  entityId: string;
  userId: string;
  shopId: string;
  dataBefore: any | null;
  dataAfter: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
