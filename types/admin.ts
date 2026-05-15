import { UserRole } from "./auth";

export interface Shop {
  id: string;
  name: string;
  type: "superette" | "quincaillerie";
  address: string;
  phone: string;
  email?: string;
  taxId?: string;
  currency: string;
  isActive: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  phone?: string;
  role: UserRole;
  pin: string;
  isActive: boolean;
  shopId?: string;
  localId?: string;
  lastLoginAt?: string;
}
