/**
 * ============================================================================
 * SERVICE : TRANSFERTS DE STOCK (Stock Transfers)
 * ============================================================================
 * 
 * Gère les mouvements de stock entre boutiques du réseau SP Services.
 * 
 * Workflow :
 *   1. CRÉATION → Un manager initie un transfert (stock déduit de la source)
 *   2. EN TRANSIT → Les produits sont en cours de déplacement
 *   3. RÉCEPTION → La boutique destination confirme (stock ajouté)
 *   4. ou ANNULATION → Stock réintégré dans la boutique source
 * 
 * Le backend gère automatiquement :
 *   - TRANSFER_OUT : Déduction du stock source à la création
 *   - TRANSFER_IN  : Ajout au stock destination à la complétion
 *   - Rollback      : Réintégration si annulé
 * 
 * Endpoints backend :
 *   POST   /api/v1/stock-transfers            → Créer un transfert
 *   GET    /api/v1/stock-transfers            → Lister avec filtres
 *   GET    /api/v1/stock-transfers/:id        → Détail
 *   PUT    /api/v1/stock-transfers/:id/status → Mettre à jour le statut
 * 
 * @see back-spservice/src/modules/stock-transfer
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import { StockTransfer, CreateStockTransferDto } from "../../types/super";

const StockTransferService = {
  /**
   * Créer un nouveau transfert de stock entre boutiques.
   * 
   * ⚠️ Le stock est IMMÉDIATEMENT déduit de la boutique source.
   * Si le stock est insuffisant, le backend renvoie une erreur 400.
   * 
   * @param dto - Données du transfert (fromShopId, toShopId, userId, items[], notes?)
   * @returns Le transfert créé avec statut PENDING
   * @throws 400 si stock insuffisant dans la boutique source
   */
  async create(dto: CreateStockTransferDto): Promise<StockTransfer> {
    const response = await axiosInstance.post("/stock-transfers", dto);
    return response.data;
  },

  /**
   * Lister tous les transferts de stock avec filtres.
   * 
   * @param params - Filtres optionnels (fromShopId, toShopId, status)
   * @returns Liste des transferts correspondant aux filtres
   */
  async getAll(params?: {
    fromShopId?: string;
    toShopId?: string;
    status?: string;
  }): Promise<any> {
    const response = await axiosInstance.get("/stock-transfers", { params });
    return response.data;
  },

  /**
   * Récupérer les détails d'un transfert par son ID.
   * 
   * @param id - UUID du transfert
   * @returns Détail complet incluant items et boutiques
   */
  async getById(id: string): Promise<StockTransfer> {
    const response = await axiosInstance.get(`/stock-transfers/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour le statut d'un transfert.
   * 
   * Transitions importantes :
   *   PENDING → IN_TRANSIT → COMPLETED (stock ajouté à la destination)
   *   PENDING → CANCELLED (stock réintégré à la source)
   *   IN_TRANSIT → CANCELLED (stock réintégré à la source)
   * 
   * @param id - UUID du transfert
   * @param status - Nouveau statut
   * @param notes - Notes optionnelles (ex: raison d'annulation)
   * @returns Le transfert mis à jour
   */
  async updateStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<StockTransfer> {
    const response = await axiosInstance.put(`/stock-transfers/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },
};

export default StockTransferService;
