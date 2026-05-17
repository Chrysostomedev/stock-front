/**
 * ============================================================================
 * SERVICE : VERSEMENTS CLIENTS (Credit Payments)
 * ============================================================================
 * 
 * Gère les paiements de crédit des clients fidèles.
 * 
 * Quand un client achète à crédit, sa dette (totalDebt) augmente.
 * Quand il effectue un versement via ce service, sa dette diminue
 * automatiquement grâce au backend (opération atomique).
 * 
 * Cas d'usage :
 *   - Client VIP qui paye en fin de mois
 *   - Client qui fait un acompte
 *   - Remboursement partiel ou total
 * 
 * Endpoints backend :
 *   POST   /api/v1/credit-payments                      → Enregistrer un versement
 *   GET    /api/v1/credit-payments/paginate             → Paginer les versements
 *   GET    /api/v1/credit-payments/customer/:customerId → Historique d'un client
 *   GET    /api/v1/credit-payments/:id                  → Détail d'un versement
 * 
 * @see back-spservice/src/modules/credit-payment
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import { CreditPayment, CreateCreditPaymentDto } from "../../types/super";

const CreditPaymentService = {
  /**
   * Enregistrer un nouveau versement (remboursement de dette client).
   * 
   * ⚠️ Le backend réduit automatiquement le champ `totalDebt` du client.
   * Le montant ne peut pas dépasser la dette actuelle du client.
   * 
   * @param dto - Données du versement (customerId, amount, method, reference?, notes?)
   * @returns Le versement enregistré
   * @throws 400 si le montant dépasse la dette du client
   */
  async create(dto: CreateCreditPaymentDto): Promise<CreditPayment> {
    const response = await axiosInstance.post("/credit-payments", dto);
    return response.data;
  },

  /**
   * Paginer tous les versements avec filtres.
   * 
   * @param params - Paramètres de pagination (page, limit, customerId?)
   * @returns Résultat paginé { data: [], meta: { total, page, limit } }
   */
  async paginate(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
  }): Promise<any> {
    const response = await axiosInstance.get("/credit-payments/paginate", { params });
    return response.data;
  },

  /**
   * Récupérer l'historique des versements d'un client spécifique.
   * 
   * Utile dans la fiche client pour voir tous les remboursements
   * effectués, avec les dates et les montants.
   * 
   * @param customerId - UUID du client
   * @returns Liste des versements ordonnés par date décroissante
   */
  async getByCustomer(customerId: string): Promise<CreditPayment[]> {
    const response = await axiosInstance.get(`/credit-payments/customer/${customerId}`);
    return response.data;
  },

  /**
   * Récupérer les détails d'un versement par son ID.
   * 
   * @param id - UUID du versement
   * @returns Détail du versement incluant les infos client
   */
  async getById(id: string): Promise<CreditPayment> {
    const response = await axiosInstance.get(`/credit-payments/${id}`);
    return response.data;
  },
};

export default CreditPaymentService;
