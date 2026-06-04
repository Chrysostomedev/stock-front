import axios from "axios";

let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
if (typeof window !== "undefined") {
  try {
    const proto = window.location.protocol || "";
    // Si on est dans Electron via Capacitor, la protocol sera 'capacitor-electron:'
    if (proto.startsWith("capacitor-electron")) {
      // Utiliser explicitement l'URL publique de l'API (prod) si aucune var d'env
      API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    }
  } catch {
    // ignore
  }
}
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  
  timeout: 8000,
});

// Debug : log le baseURL pour vérifier en Electron
if (typeof window !== "undefined") {
  console.log("🔍 Axios baseURL:", axiosInstance.defaults.baseURL);
}

// ─────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") return config;

    const isOnline = navigator.onLine;

    if (isOnline) {
      // Mode normal — access token standard
      const token = localStorage.getItem("access_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Mode offline — utiliser le token offline s'il est encore valide
      const offlineToken  = localStorage.getItem("offline_token");
      const offlineExpiry = localStorage.getItem("offline_token_expiry");
      const offlineValid  =
        offlineToken && offlineExpiry && new Date(offlineExpiry) > new Date();

      if (offlineValid) {
        config.headers.Authorization = `Bearer ${offlineToken}`;
      } else {
        // Fallback : access_token (peut être expiré, mais le backend peut encore l'accepter
        // si offline_token est également absent)
        const token = localStorage.getItem("access_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────
// INTERCEPTEUR RESPONSE — gestion des erreurs globales
//
// ⚠️  NE PAS rediriger automatiquement sur 401 ici.
//     Le AuthProvider gère lui-même le refresh token et la déconnexion.
//     Une redirection automatique ici crée une boucle infinie sur
//     Electron et mobile (le 401 de /auth/me au démarrage déclenchait
//     une redirect → rechargement → 401 → redirect → ∞).
// ─────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // On propage l'erreur telle quelle — chaque service/contexte la gère
    return Promise.reject(error);
  },
);

export default axiosInstance;
