/**
 * network-check.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaire de détection de connectivité vers le backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function isReallyOnline(timeoutMs = 3000): Promise<boolean> {
  const navOnLine =
    typeof navigator !== "undefined" ? navigator.onLine : true;

  console.log("[network-check] navigator.onLine =", navOnLine);

  if (!navOnLine) {
    console.log("[network-check] → false (navigator dit offline)");
    return false;
  }

  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://back-spservice-production.up.railway.app/api/v1"
  ).replace(/\/api\/v1\/?$/, "");

  const pingUrl = `${apiBase}/api/v1`;
  console.log("[network-check] ping →", pingUrl, `(timeout: ${timeoutMs}ms)`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(pingUrl, {
      method: "HEAD",
      mode: "no-cors", // évite le rejet CORS (localhost vs Railway) — opaque response = serveur joignable
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);
    console.log("[network-check] → true (réponse reçue)");
    return true;
  } catch (err: unknown) {
    clearTimeout(timer);
    const name = (err as any)?.name ?? "unknown";
    const message = (err as any)?.message ?? String(err);
    console.warn(`[network-check] → false (${name}: ${message})`);
    return false;
  }
}
