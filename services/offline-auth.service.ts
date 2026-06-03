/**
 * offline-auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestion du token offline (30 jours) et de la validation PIN locale.
 *
 * Clés localStorage utilisées :
 *   offline_token          → JWT valide 30 jours
 *   offline_token_expiry   → ISO date d'expiration
 *   offline_user_snapshot  → objet user complet avec PIN (venant du backend)
 *
 * Endpoints backend :
 *   POST /auth/offline-session  → générer le token offline (JWT requis)
 *   POST /auth/pin-login        → valider PIN + obtenir un nouveau token offline
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axiosInstance from "@/core/axios";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface OfflineUser {
  id: string;
  username: string;
  name: string;
  role: string;
  /** PIN brut ou hashé bcrypt ($2b$...) */
  pin: string;
  phone: string;
  shopAccesses: Array<{
    shopId: string;
    shopName: string;
    roleInShop: string;
  }>;
}

export interface OfflineSessionResponse {
  offlineToken: string;
  expiresAt: string;
  user: OfflineUser;
}

// ─────────────────────────────────────────────
// CLÉS
// ─────────────────────────────────────────────

const KEYS = {
  TOKEN:    "offline_token",
  EXPIRY:   "offline_token_expiry",
  SNAPSHOT: "offline_user_snapshot",
} as const;

// ─────────────────────────────────────────────
// HELPERS INTERNES
// ─────────────────────────────────────────────

function store(): Storage | null {
  return typeof window !== "undefined" ? localStorage : null;
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

const OfflineAuthService = {
  // ── Appels backend ──────────────────────────

  /** Génère un token offline 30 jours (JWT d'accès requis). */
  async generateOfflineSession(): Promise<OfflineSessionResponse> {
    const res = await axiosInstance.post<OfflineSessionResponse>(
      "/auth/offline-session"
    );
    return res.data;
  },

  /**
   * Valide un PIN contre le backend et renouvelle le token offline.
   * À appeler quand le token offline est expiré ET qu'on est en ligne.
   */
  async pinLogin(username: string, pin: string): Promise<OfflineSessionResponse> {
    const res = await axiosInstance.post<OfflineSessionResponse>(
      "/auth/pin-login",
      { username, pin }
    );
    return res.data;
  },

  // ── Persistance locale ───────────────────────

  /** Sauvegarde le résultat de /auth/offline-session ou /auth/pin-login. */
  saveSession(session: OfflineSessionResponse): void {
    const ls = store();
    if (!ls) return;
    ls.setItem(KEYS.TOKEN,    session.offlineToken);
    ls.setItem(KEYS.EXPIRY,   session.expiresAt);
    ls.setItem(KEYS.SNAPSHOT, JSON.stringify(session.user));
  },

  /** Supprime toutes les données offline (appelé au logout). */
  clearSession(): void {
    const ls = store();
    if (!ls) return;
    ls.removeItem(KEYS.TOKEN);
    ls.removeItem(KEYS.EXPIRY);
    ls.removeItem(KEYS.SNAPSHOT);
  },

  // ── Lecture ──────────────────────────────────

  getToken(): string | null {
    return store()?.getItem(KEYS.TOKEN) ?? null;
  },

  isTokenValid(): boolean {
    const token  = store()?.getItem(KEYS.TOKEN);
    const expiry = store()?.getItem(KEYS.EXPIRY);
    if (!token || !expiry) return false;
    return new Date(expiry) > new Date();
  },

  getUserSnapshot(): OfflineUser | null {
    try {
      const raw = store()?.getItem(KEYS.SNAPSHOT);
      return raw ? (JSON.parse(raw) as OfflineUser) : null;
    } catch {
      return null;
    }
  },

  hasSnapshot(): boolean {
    return !!store()?.getItem(KEYS.SNAPSHOT);
  },
  // ── Validation PIN locale (mode offline) ────

  /**
   * Valide le PIN saisi contre le snapshot stocké localement.
   *
   * Support :
   *  - PIN en clair       → comparaison directe
   *  - PIN hashé bcrypt   → nécessite bcryptjs (avertissement si absent)
   *
   * Retourne true si le PIN correspond, false sinon.
   */
  validatePinLocally(pin: string): boolean {
    const snapshot = this.getUserSnapshot();
    if (!snapshot?.pin) return false;
    const stored = snapshot.pin;
    // Détection hash bcrypt ($2a$ ou $2b$)
    if (stored.startsWith("$2")) {
      // bcryptjs non installé → avertir et refuser
      console.warn(
        "[OfflineAuth] PIN hashé en bcrypt détecté — " +
        "installez bcryptjs pour la validation locale : npm install bcryptjs"
      );
      return false;
    }
    // PIN en clair
    return stored === pin;
  },
};

export default OfflineAuthService;
