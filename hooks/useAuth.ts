"use client";

/**
 * useAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook d'authentification compatible Web + Electron + Capacitor.
 *
 * Stratégie de lecture du token :
 *  1. Cookies (web standard)
 *  2. localStorage (Electron / Capacitor — les cookies ne persistent pas)
 *
 * Stratégie de lecture du user :
 *  1. localStorage["user"] — disponible immédiatement, pas de requête réseau
 *  2. GET /auth/me — si localStorage vide (première connexion ou cache expiré)
 *
 * Cela évite :
 *  - La sidebar blanche sur Electron/mobile (user null car cookie absent)
 *  - Les 401 en boucle sur /auth/me quand le CORS bloque
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { LoginCredentials, User, UserRole } from "../types/auth";
import AuthService from "../services/auth.service";
import { useRouter } from "next/navigation";
import { isReallyOnline } from "@/core/network-check";

/** Lit le token depuis cookies OU localStorage (fallback Electron/mobile) */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    Cookies.get("access_token") ||
    localStorage.getItem("access_token") ||
    null
  );
}

/** Décode le payload d'un JWT sans vérification de signature (côté client) */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

/**
 * Vérifie si un JWT est expiré (avec 60s de marge pour anticiper le réseau).
 * Retourne true si le token est invalide ou expiré.
 */
function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() / 1000 > payload.exp - 60;
}

/** Lit le user depuis localStorage (évite un appel réseau au démarrage) */
function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    // Compatibilité multi-boutique
    if (!parsed.shopId && (parsed as any).shopAccesses?.length > 0) {
      parsed.shopId = (parsed as any).shopAccesses[0].shopId;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useAuth() {
  // Initialisation immédiate depuis localStorage — évite le flash blanc
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!getStoredToken()
  );
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Vérification locale de l'expiration JWT avant tout appel réseau.
      // Évite les 401 sur /auth/me quand le cookie browser (7j) est encore
      // présent mais que le JWT (24h) a expiré.
      if (isJwtExpired(token)) {
        const userId = typeof window !== "undefined"
          ? localStorage.getItem("user_id")
          : null;
        let tokenRefreshed = false;

        if (userId) {
          try {
            const res = await AuthService.refreshToken(userId);
            const newToken = res.accessToken || res.token?.accessToken;
            if (newToken) {
              Cookies.set("access_token", newToken, { expires: 7 });
              Cookies.set("token", newToken, { expires: 7 });
              localStorage.setItem("access_token", newToken);
              localStorage.setItem("token", newToken);
              if (res.refreshToken || res.token?.refreshToken) {
                localStorage.setItem(
                  "refresh_token",
                  res.refreshToken || res.token?.refreshToken
                );
              }
              tokenRefreshed = true;
            }
          } catch {
            // Refresh échoué (token refresh expiré ou backend indisponible)
          }
        }

        if (!tokenRefreshed) {
          _clearStorage();
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
        setIsAuthenticated(true);
        setLoading(false);
        // Rafraîchissement silencieux en arrière-plan (ne bloque pas l'UI)
        AuthService.getProfile()
          .then((profile) => {
            let finalUser = profile;
            if (!profile.shopId && (profile as any).shopAccesses?.length > 0) {
              finalUser = { ...profile, shopId: (profile as any).shopAccesses[0].shopId };
            }
            setUser(finalUser);
            localStorage.setItem("user", JSON.stringify(finalUser));
          })
          .catch(() => {
            // Silencieux — on garde le cache localStorage
          });
        return;
      }

      // Pas de cache → appel réseau obligatoire
      try {
        const profile = await AuthService.getProfile();
        let finalUser = profile;
        if (!profile.shopId && (profile as any).shopAccesses?.length > 0) {
          finalUser = {
            ...profile,
            shopId: (profile as any).shopAccesses[0].shopId,
          };
        }

        setUser(finalUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(finalUser));
      } catch {
        // Token invalide → nettoyage
        _clearStorage();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const online = await isReallyOnline();
    if (!online) {
      throw new Error("Aucune connexion internet. Vérifiez votre réseau et réessayez.");
    }
    // Nettoyer les tokens expirés AVANT de tenter le login pour éviter que
    // refreshUser (déclenché au montage) appelle /auth/logout avec un token périmé
    _clearStorage();

    const response = await AuthService.login(credentials);
    const accessToken = response.accessToken || response.token?.accessToken;
    const refreshToken = response.refreshToken || response.token?.refreshToken;
    const userData = response.user;

    if (!accessToken) {
      throw new Error("Erreur d'authentification : Token manquant");
    }

    // Cookies (web)
    Cookies.set("access_token", accessToken, { expires: 7 });
    Cookies.set("token", accessToken, { expires: 7 });
    Cookies.set("userRole", userData.role, { expires: 7 });

    // Stockage dans LocalStorage pour l'UI
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("userRole", userData.role);

    // Compatibilité multi-boutique
    let finalUser = userData;
    if (!userData.shopId && (userData.shopAccesses?.length || 0) > 0) {
      finalUser = { ...userData, shopId: userData.shopAccesses![0].shopId };
    }

    // Sauvegarder le user complet pour éviter /auth/me au prochain démarrage
    localStorage.setItem("user", JSON.stringify(finalUser));

    setUser(finalUser);
    setIsAuthenticated(true);

    // Redirection automatique selon le rôle
    // Backend roles : SUPER_ADMIN, ADMIN, MANAGER, CASHIER, AUDITOR
   if (finalUser.role === "SUPER_ADMIN" || finalUser.role === "ADMIN")
  router.push("/admin");
else if (finalUser.role === "CASHIER") router.push("/super");
else if (finalUser.role === "MANAGER") router.push("/quinc");
else if (finalUser.role === "AUDITOR") router.push("/admin");
else router.push("/admin");

    return finalUser;
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // Silencieux
    }
    _clearStorage();
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

/** Nettoie tous les tokens et données utilisateur */
function _clearStorage() {
  Cookies.remove("access_token");
  Cookies.remove("token");
  Cookies.remove("userRole");
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
  }
}
