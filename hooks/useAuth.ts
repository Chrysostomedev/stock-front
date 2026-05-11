"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { User, UserRole } from "../types/auth";
import AuthService from "../services/auth.service";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await AuthService.getProfile();
        setUser(profile);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        Cookies.remove("token");
        Cookies.remove("userRole");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    const response = await AuthService.login(credentials);
    const { accessToken, user } = response;

    // Stockage dans Cookies pour le Middleware
    Cookies.set("token", accessToken, { expires: 7 });
    Cookies.set("userRole", user.role, { expires: 7 });
    
    // Stockage dans LocalStorage pour l'UI
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userRole", user.role);

    setUser(user);
    setIsAuthenticated(true);

    // Redirection automatique selon le rôle
    if (user.role === "admin") router.push("/admin");
    else if (user.role === "caissiere") router.push("/super");
    else if (user.role === "gerant") router.push("/quinc");

    return user;
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    Cookies.remove("token");
    Cookies.remove("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    role: user?.role as UserRole,
  };
}
