export type UserRole = "admin" | "caissiere" | "gerant";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  shopId?: string;
  shopName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
