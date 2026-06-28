import { ShopType } from "@/services/shop.service";
import { UserRole } from "./auth";

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  taxId?: string;
  currency: string;
  isActive: boolean;
  shopType: ShopType;
  shopTypeLabel: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  role: UserRole;
  pin: string;
  isActive: boolean;
  shopId?: string;
  localId?: string;
  lastLoginAt?: string;
}

export interface UserShopAccess {
  id: string;
  userId: string;
  shopId: string;
  roleInShop: UserRole;
  user?: UserAccount;
  shop?: Shop;
  createdAt?: string;
  updatedAt?: string;
}
