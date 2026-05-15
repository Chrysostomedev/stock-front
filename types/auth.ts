export type UserRole = "ADMIN" | "SUPER_ADMIN" | "MANAGER" | "CASHIER" | "AUDITOR";

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
  role: UserRole;
  shopId?: string;
  shopName?: string;
  shopAccesses?: { shopId: string; role: string }[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user: User;
  token?: {
    accessToken: string;
    refreshToken: string;
  };
}
