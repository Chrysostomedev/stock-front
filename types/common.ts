/**
 * Types communs partagés par tous les modules.
 */

/** Réponse paginée standard retournée par le backend pour les listes. */
export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Erreur HTTP retournée par le backend (corps de la réponse 4xx/5xx). */
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
