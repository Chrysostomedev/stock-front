import axios from "axios";

const DEFAULT_API_URL = "https://back-spservice.onrender.com/api/v1";
const rawEnvUrl = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_URL : undefined;
// Si l'environnement pointe encore vers l'ancien Railway, on force Render
const ENV_API_URL = rawEnvUrl && !rawEnvUrl.includes("railway.app") ? rawEnvUrl : undefined;

let API_URL = ENV_API_URL || DEFAULT_API_URL;
if (typeof window !== "undefined") {
  try {
    const proto = window.location.protocol || "";
    if (proto.startsWith("capacitor-electron")) {
      API_URL = ENV_API_URL || DEFAULT_API_URL;
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
      const offlineToken = localStorage.getItem("offline_token");
      const offlineExpiry = localStorage.getItem("offline_token_expiry");
      const offlineValid =
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
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // On propage l'erreur telle quelle — chaque service/contexte la gère
    return Promise.reject(error);
  },
);

export default axiosInstance;
