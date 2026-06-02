import axios from "axios";

// URL de l'API — injectée au build depuis .env (NEXT_PUBLIC_API_URL)
// Parfois `process.env` n'est pas disponible dans l'environnement Electron
// (renderer) — détecter le runtime et appliquer un fallback runtime.
let API_URL = process.env.NEXT_PUBLIC_API_URL || "https://back-spservice-production.up.railway.app/api/v1";
if (typeof window !== "undefined") {
  try {
    const proto = window.location.protocol || "";
    // Si on est dans Electron via Capacitor, la protocol sera 'capacitor-electron:'
    if (proto.startsWith("capacitor-electron")) {
      // Utiliser explicitement l'URL publique de l'API (prod) si aucune var d'env
      API_URL = process.env.NEXT_PUBLIC_API_URL || "https://back-spservice-production.up.railway.app/api/v1";
    }
  } catch (e) {
    // ignore
  }
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Timeout de 8s — détecte plus vite l'offline sur mobile/Electron (navigator.onLine peu fiable)
  // Évite les timeouts infinis en mode hors-ligne
  timeout: 8000,
});

// Debug : log le baseURL pour vérifier en Electron
if (typeof window !== "undefined") {
  console.log("🔍 Axios baseURL:", axiosInstance.defaults.baseURL);
}

// ─────────────────────────────────────────────
// INTERCEPTEUR REQUEST — injecte le JWT
// ─────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
