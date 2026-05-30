import axios from "axios";

// URL de l'API — injectée au build depuis .env (NEXT_PUBLIC_API_URL)
// Fallback sur Railway en production
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://back-spservice-production.up.railway.app/api/v1";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Timeout de 15s — évite les loaders infinis sur réseau lent (mobile/Electron)
  timeout: 15000,
});

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
  }
);

export default axiosInstance;
