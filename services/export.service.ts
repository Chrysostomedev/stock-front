/**
 * export.service.ts — Téléchargement de rapports PDF/Excel
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilise fetch natif (pas axios) pour récupérer des réponses binaires (blob).
 * Le token est lu depuis localStorage et injecté dans Authorization.
 * Le nom du fichier est extrait du header Content-Disposition.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PROD_API_URL = "https://back-spservice-production.up.railway.app/api/v1";
const BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || PROD_API_URL;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getFilenameFromHeaders(headers: Headers, fallback: string): string {
  const disposition = headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+?)"/);
  return match?.[1] ?? fallback;
}

const HTTP_ERRORS: Record<number, string> = {
  400: "Paramètres de rapport invalides",
  401: "Session expirée — reconnexion requise",
  404: "Boutique introuvable",
  500: "Erreur serveur — réessayez dans quelques instants",
};

/**
 * Télécharge un rapport depuis le backend et déclenche le téléchargement natif.
 *
 * @param endpoint       ex: "/reports/sales/export"
 * @param params         Query params (les valeurs undefined/vides sont filtrées)
 * @param fallbackName   Nom de fichier si le header Content-Disposition est absent
 */
export async function downloadReport(
  endpoint: string,
  params: Record<string, string | undefined>,
  fallbackName: string
): Promise<void> {
  const token = getToken();

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(HTTP_ERRORS[response.status] || "Impossible de générer le rapport");
  }

  const blob = await response.blob();
  const filename = getFilenameFromHeaders(response.headers, fallbackName);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/** Calcule fromDate/toDate ISO à partir d'une période nommée */
export function periodToDateRange(period: "today" | "7days" | "month" | "year" | "all"): {
  fromDate?: string;
  toDate?: string;
} {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { fromDate: start.toISOString(), toDate: endOfDay.toISOString() };
    }
    case "7days": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { fromDate: start.toISOString(), toDate: endOfDay.toISOString() };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { fromDate: start.toISOString(), toDate: endOfDay.toISOString() };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { fromDate: start.toISOString(), toDate: endOfDay.toISOString() };
    }
    case "all":
    default:
      return {};
  }
}
