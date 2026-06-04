/**
 * network-check.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Détecte la connectivité internet réelle.
 *
 * On utilise le DNS-over-HTTPS de Google (CORS ouvert, pas de CORP restrictif)
 * plutôt que le backend Railway qui bloque les requêtes cross-origin avec
 * Cross-Origin-Resource-Policy: same-origin → ERR_BLOCKED_BY_RESPONSE.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PING_URL = "https://dns.google/resolve?name=google.com&type=A";

export async function isReallyOnline(timeoutMs = 4000): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.log("[network-check] navigator.onLine = false → offline");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(PING_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log("[network-check] → true");
    return true;
  } catch (err: unknown) {
    clearTimeout(timer);
    const name = (err as any)?.name ?? "unknown";
    // AbortError = timeout réseau réel, pas juste un rejet CORP/CORS
    console.warn(`[network-check] → false (${name})`);
    return false;
  }
}
