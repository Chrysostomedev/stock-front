"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  lazy,
  Suspense,
} from "react";

const PinScreen = lazy(() => import("@/components/offline/PinScreen"));
import axios from "axios";
import toast from "react-hot-toast";
import { User } from "@/types/auth";
import { ApiErrorResponse } from "@/types/global";
import axiosInstance from "@/core/axios";
import { useNetwork } from "@/hooks/useNetwork";
import OfflineAuthService from "@/services/offline-auth.service";
import SyncService from "@/services/sync.service";

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
  /** true quand le token est expiré mais un snapshot offline existe → afficher PinScreen */
  needsPinUnlock: boolean;
  login: (
    phone: string,
    password: string,
  ) => Promise<{ user: User; accessToken: string; refreshToken: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Valide le PIN et déverrouille la session (online ou offline) */
  unlockWithPin: (pin: string) => Promise<void>;
}

// ─────────────────────────────────────────────
// CONTEXTE
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsPinUnlock, setNeedsPinUnlock] = useState<boolean>(false);
  
  // Utilise le hook useNetwork pour une meilleure détection offline (Capacitor sur mobile/Electron)
  const { isOnline } = useNetwork();

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
    // Détection offline : vérifier si la requête peut atteindre le serveur
    if (!isOnline) {
      console.warn("📴 Mode offline — authentification impossible");
      toast.error("Impossible de se connecter — mode hors-ligne actif");
      throw new Error("Mode hors-ligne : authentification requise");
    }

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

      // Sauvegarde locale des tokens ET du user
      saveTokens(accessToken, refreshToken, userData.id);
      localStorage.setItem("user", JSON.stringify(userData));

      // Mise à jour du contexte global
      setUser(userData);
      setIsAuthenticated(true);
      setNeedsPinUnlock(false);

      // Générer et stocker le token offline 30 jours (non bloquant)
      OfflineAuthService.generateOfflineSession()
        .then((session) => OfflineAuthService.saveSession(session))
        .catch(() => console.warn("[Auth] Token offline non généré"));

      // [7] Charger le snapshot initial si ce n'est pas encore fait (non bloquant)
      const shopId =
        userData.shopId ||
        (userData as any).shopAccesses?.[0]?.shopId;
      if (shopId && !SyncService.isSnapshotLoaded(shopId)) {
        SyncService.loadSnapshot(shopId)
          .then(() =>
            console.log("[Auth] Snapshot initial chargé pour", shopId)
          )
          .catch((e) =>
            console.warn("[Auth] Snapshot non chargé (réessai au prochain fullSync) :", e)
          );
      }

      return { user: userData, accessToken, refreshToken };
    } catch (error: unknown) {
      // Vérifier si c'est une erreur réseau (offline/timeout)
      if (axios.isAxiosError(error)) {
        // Pas de réponse = erreur réseau (offline, timeout, etc.)
        if (!error.response) {
          const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
          console.warn(`⚠️  Erreur réseau${isTimeout ? ' (timeout)' : ''} — impossible de contacter le serveur`);
          
          // Fallback offline : si un token valide existe, laisser l'utilisateur se reconnecter
          const cachedToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          const cachedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          
          if (cachedToken && cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              console.log("📴 Fallback offline : reconnnexion avec profil en cache");
              setUser(parsedUser);
              setIsAuthenticated(true);
              toast.success("Reconnecté (mode hors-ligne avec profil en cache)");
              return { user: parsedUser, accessToken: cachedToken, refreshToken: cachedToken };
            } catch (e) {
              console.warn("❌ Impossible de parser l'utilisateur en cache");
            }
          }
          
          toast.error("Connexion impossible — vérifiez votre connexion internet");
          throw new Error("Erreur réseau : serveur injoignable");
        }

        // Réponse HTTP reçue avec erreur
        console.error("❌ Erreur Axios login:", error.response?.data);
        const message = error.response?.data?.message || "Erreur de connexion";
        toast.error(message);
        throw new Error(message);
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
    OfflineAuthService.clearSession();
    setUser(null);
    setIsAuthenticated(false);
    setNeedsPinUnlock(false);
  };

  // ─────────────────────────────────────────────
  // UNLOCK WITH PIN
  // Appelé depuis PinScreen — valide le PIN en ligne ou hors ligne
  // ─────────────────────────────────────────────
  const unlockWithPin = async (pin: string): Promise<void> => {
    const snapshot = OfflineAuthService.getUserSnapshot();
    if (!snapshot) throw new Error("Aucun profil offline trouvé");

    if (navigator.onLine) {
      // En ligne → valider via backend → obtenir un nouveau token offline 30j
      const session = await OfflineAuthService.pinLogin(snapshot.username, pin);
      OfflineAuthService.saveSession(session);
      // Le token offline devient le token d'accès courant
      localStorage.setItem("access_token", session.offlineToken);
      localStorage.setItem("user", JSON.stringify(session.user));
      setUser(session.user as unknown as User);
    } else {
      // Hors ligne → validation locale contre le snapshot
      const valid = OfflineAuthService.validatePinLocally(pin);
      if (!valid) throw new Error("PIN incorrect");
    }

    setIsAuthenticated(true);
    setNeedsPinUnlock(false);
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

    // En Electron : chercher l'user en cache localStorage
    let cachedUser: User | null = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) cachedUser = JSON.parse(raw) as User;
    } catch {
      cachedUser = null;
    }

    // 🔴 CRITICAL: Si offline → JAMAIS appeler axiosInstance (évite le timeout)
    if (!isOnline) {
      console.warn("📴 Mode offline détecté");
      if (cachedUser) {
        console.warn("📴 Utilisation du user en cache");
        setUser(cachedUser);
        setIsAuthenticated(true);
      } else {
        console.warn("📴 Pas de session en cache — déconnexion");
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
      return;
    }

    // En ligne : si pas de token, on peut pas aller plus loin
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Appel /auth/me — le token est envoyé automatiquement par l'intercepteur Axios
      const res = await axiosInstance.get<User>(`/auth/me`);
      if (isMounted.current) {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
        setIsAuthenticated(true);
      }
    } catch (error: unknown) {
      // Fallback Electron : si /auth/me échoue mais on a un user en cache, on le garde
      if (cachedUser && isMounted.current) {
        console.warn("⚠️  /auth/me échoué, mais user trouvé en cache localStorage", cachedUser);
        setUser(cachedUser);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
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
                localStorage.setItem("user", JSON.stringify(retryRes.data));
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
      // Dans tous les cas d'échec → vérifier snapshot offline avant de déconnecter
      if (isMounted.current && !cachedUser) {
        const snapshot = OfflineAuthService.getUserSnapshot();
        if (snapshot) {
          // Token expiré mais snapshot offline présent → demander PIN
          console.warn("[Auth] Token expiré — snapshot offline trouvé → PIN requis");
          setUser(snapshot as unknown as User);
          setNeedsPinUnlock(true);
          setIsAuthenticated(false);
        } else {
          logout();
        }
      } else if (isMounted.current && cachedUser) {
        console.warn("⚠️  Erreur /auth/me mais user en cache, on le garde");
        setUser(cachedUser);
        setIsAuthenticated(true);
      }
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
  }, [isOnline]);

  // ─────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, needsPinUnlock, login, logout, refreshUser, unlockWithPin }}
    >
      {children}
      {/* Overlay PIN — affiché quand le token est expiré mais un snapshot offline existe */}
      {needsPinUnlock && (
        <Suspense fallback={null}>
          <PinScreen />
        </Suspense>
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

/** Alias pour la compatibilité avec les imports depuis @/hooks/useAuth */
export { useAuth as default };