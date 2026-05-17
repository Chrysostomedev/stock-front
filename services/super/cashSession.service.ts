/**
 * ============================================================================
 * SERVICE : SESSIONS DE CAISSE (Cash Sessions)
 * ============================================================================
 * 
 * Gère le cycle de vie d'une session de caisse :
 *   1. OUVERTURE → Le caissier déclare son fond de caisse initial
 *   2. VENTES    → Toutes les ventes sont rattachées à la session active
 *   3. FERMETURE → Le caissier compte le montant réel en caisse
 * 
 * Le backend compare automatiquement le solde théorique (ouverture + ventes - dépenses)
 * au solde réel déclaré à la fermeture pour détecter les écarts.
 * 
 * Endpoints backend :
 *   POST   /api/v1/cash-sessions/open            → Ouvrir une session
 *   PATCH  /api/v1/cash-sessions/:id/close        → Fermer une session
 *   GET    /api/v1/cash-sessions/active/:userId    → Récupérer la session active
 * 
 * @see back-spservice/src/modules/cash-session
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import {
  CashSession,
  OpenCashSessionDto,
  CloseCashSessionDto,
} from "../../types/super";

const CashSessionService = {
  /**
   * Ouvrir une nouvelle session de caisse.
   * 
   * ⚠️ IMPORTANT : Le backend interdit d'ouvrir une session si une session
   * est déjà active pour cet utilisateur (erreur 409 Conflict).
   * 
   * @param dto - Données d'ouverture (shopId, userId, openingBalance, notes?)
   * @returns La session nouvellement créée
   * @throws 409 si une session est déjà active pour cet utilisateur
   */
  async open(dto: OpenCashSessionDto): Promise<CashSession> {
    const response = await axiosInstance.post("/cash-sessions/open", dto);
    return response.data;
  },

  /**
   * Fermer une session de caisse active.
   * 
   * Le caissier doit compter l'argent en caisse et déclarer le montant réel.
   * Le backend calcule automatiquement l'écart entre le théorique et le réel.
   * 
   * @param id - UUID de la session à fermer
   * @param dto - Données de fermeture (closingBalance, notes?)
   * @returns La session mise à jour avec les données de fermeture
   * @throws 404 si la session n'existe pas
   */
  async close(id: string, dto: CloseCashSessionDto): Promise<CashSession> {
    const response = await axiosInstance.patch(`/cash-sessions/${id}/close`, dto);
    return response.data;
  },

  /**
   * Récupérer la session de caisse active d'un utilisateur.
   * 
   * Retourne `null` si aucune session n'est active.
   * Cette méthode est appelée au chargement de la page Caisse pour
   * déterminer si le caissier doit ouvrir une nouvelle session.
   * 
   * @param userId - UUID de l'utilisateur (caissier)
   * @returns La session active ou null
   */
  async getActive(userId: string): Promise<CashSession | null> {
    const response = await axiosInstance.get(`/cash-sessions/active/${userId}`);
    return response.data;
  },
};

export default CashSessionService;
