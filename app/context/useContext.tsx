"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { User } from "@/types/auth";
import { ApiErrorResponse } from "@/types/global";
import axiosInstance from "@/core/axios";

// Structure de la réponse de login renvoyée par ton API
interface LoginResponse {
  user: User;
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

// Structure de la réponse de refresh renvoyée par ton API
interface RefreshResponse {
  token?: {
    accessToken?: string;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
}

// Contrat du contexte Auth exposé aux composants
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    phone: string,
    password: string,
  ) => Promise<{ user: User; accessToken: string; refreshToken: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ─────────────────────────────────────────────
// CONTEXTE
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Ref pour éviter les mises à jour d'état sur un composant démonté
  const isMounted = useRef<boolean>(true);
  // Ref pour éviter plusieurs appels refresh simultanés
  const isRefreshing = useRef<boolean>(false);

  // ─────────────────────────────────────────────
  // HELPER : sauvegarde des tokens en localStorage
  // ─────────────────────────────────────────────
  const saveTokens = (
    accessToken: string,
    refreshToken: string,
    userId?: string,
  ): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      if (userId) localStorage.setItem("user_id", userId);
    }
  };

  const login = async (
    phone: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    try {
      const res = await axiosInstance.post<LoginResponse>(`/auth/login`, {
        phone,
        password,
      });
      // console.log("Réponse complète du backend:", res.data);
      const userData: User = res.data.user;
      const accessToken: string = res.data.token?.accessToken;
      const refreshToken: string = res.data.token?.refreshToken;

      // Vérification de sécurité : si l'API ne retourne pas ce qu'on attend
      if (!accessToken || !refreshToken || !userData) {
        console.error("❌ Tokens ou user manquants dans la réponse!");
        throw new Error("Réponse de connexion invalide du serveur");
      }

      // Sauvegarde locale des tokens
      saveTokens(accessToken, refreshToken, userData.id);

      // Mise à jour du contexte global
      setUser(userData);
      setIsAuthenticated(true);

      return { user: userData, accessToken, refreshToken };
    } catch (error: unknown) {
      // Erreur Axios (réponse du serveur reçue avec un code d'erreur HTTP)
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        console.error("❌ Erreur Axios login:", error.response?.data);
        const message= error.response?.data?.message || "Erreur de connexion"
        toast.error(message)
        throw new Error(error.response?.data?.message || "Erreur de connexion");
      }
      // Erreur JS standard (réseau coupé, timeout, etc.)
      if (error instanceof Error) {
        console.error("❌ Erreur login:", error.message);
        throw new Error(error.message);
      }
      throw new Error("Erreur de connexion inconnue");
    }
  };

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  // ─────────────────────────────────────────────
  // REFRESH USER (vérifie la session au chargement)
  // ─────────────────────────────────────────────
  const refreshUser = async (): Promise<void> => {
    // Pas de localStorage côté serveur (SSR)
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token: string | null = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Appel /auth/me — le token est envoyé automatiquement par l'intercepteur Axios
      const res = await axiosInstance.get<User>(`/auth/me`);
      if (isMounted.current) {
        setUser(res.data);
        setIsAuthenticated(true);
      }
    } catch (error: unknown) {
      // Si le token est expiré (401), on tente un refresh
      const isAxios401 =
        axios.isAxiosError(error) && error.response?.status === 401;

      if (isAxios401 && !isRefreshing.current) {
        isRefreshing.current = true;

        const storedRefreshToken: string | null =
          localStorage.getItem("refresh_token");
        const userId: string | null = localStorage.getItem("user_id");

        if (storedRefreshToken && userId) {
          try {
            const refreshRes = await axiosInstance.post<RefreshResponse>(
              `/auth/refresh/${userId}`,
              { refreshToken: storedRefreshToken },
            );

            // Compatibilité avec plusieurs structures de réponse possibles
            const newAccessToken: string | undefined =
              refreshRes.data.token?.accessToken ||
              refreshRes.data.accessToken ||
              refreshRes.data.access_token;

            const newRefreshToken: string | undefined =
              refreshRes.data.token?.refreshToken ||
              refreshRes.data.refreshToken ||
              refreshRes.data.refresh_token;

            if (newAccessToken && newRefreshToken) {
              console.log("✅ Tokens rafraîchis avec succès.");
              saveTokens(newAccessToken, newRefreshToken);
              // Retry de /auth/me avec le nouveau token
              const retryRes = await axiosInstance.get<User>(`/auth/me`);
              if (isMounted.current) {
                setUser(retryRes.data);
                setIsAuthenticated(true);
                isRefreshing.current = false;
                return;
              }
            }
          } catch (refreshError: unknown) {
            // Le refresh a échoué → session définitivement expirée
            if (axios.isAxiosError<ApiErrorResponse>(refreshError)) {
              console.error(
                "❌ Refresh échoué:",
                refreshError.response?.data?.message,
              );
            } else {
              console.error("❌ Refresh échoué : session expirée.");
            }
          }
        }
        isRefreshing.current = false;
      }
      // Dans tous les cas d'échec → déconnexion propre
      if (isMounted.current) logout();
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };
  // ─────────────────────────────────────────────
  // INITIALISATION : vérifie la session au montage
  // ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    refreshUser();
    // Nettoyage : empêche les setState après démontage
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout, refreshUser }}
    >
      {!loading ? (
        children
      ) : (
        // Écran de chargement affiché pendant la vérification de session
        <div className="flex h-screen flex-col items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-title border-t-transparent" />
          <h2 className="mt-4 text-muted font-bold">
            Chargement de votre session...
          </h2>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────
// HOOK : useAuth
// ─────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};