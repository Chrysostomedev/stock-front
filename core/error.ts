import { AxiosError } from "axios";

/**
 * Extrait un message lisible depuis n'importe quelle erreur throwée.
 * Remplace le pattern `catch (err: any) { err.response?.data?.message }`.
 */
export function getErrorMessage(err: unknown, fallback = "Une erreur est survenue"): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
