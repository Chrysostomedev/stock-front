/**
 * ============================================================================
 * SERVICE : BONS DE COMMANDE FOURNISSEUR (Purchase Orders)
 * ============================================================================
 * 
 * Gère le cycle de vie des commandes fournisseur :
 *   1. CRÉATION   → Le manager crée un bon de commande avec les articles
 *   2. ENVOI      → Le bon est envoyé au fournisseur (statut SENT)
 *   3. RÉCEPTION  → Les articles sont reçus et le stock est incrémenté
 *   4. CLÔTURE    → Toutes les quantités ont été reçues (statut RECEIVED)
 * 
 * Chaque réception crée automatiquement un mouvement de stock (PURCHASE)
 * dans le backend via le module stock-movement.
 * 
 * Endpoints backend :
 *   POST   /api/v1/purchase-orders              → Créer un bon de commande
 *   GET    /api/v1/purchase-orders              → Lister (avec filtres)
 *   GET    /api/v1/purchase-orders/:id          → Détail
 *   PUT    /api/v1/purchase-orders/:id/status   → Changer le statut
 *   POST   /api/v1/purchase-orders/:id/receive  → Réceptionner des articles
 * 
 * @see back-spservice/src/modules/purchase-order
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  ReceiveItemsDto,
} from "../../types/super";

const PurchaseOrderService = {
  /**
   * Créer un nouveau bon de commande fournisseur.
   * 
   * Le statut initial est automatiquement DRAFT.
   * Le montant total est calculé automatiquement par le backend
   * (somme des quantityOrdered × unitCost pour chaque item).
   * 
   * @param dto - Données de la commande (supplierId, shopId, items[], notes?, expectedAt?)
   * @returns Le bon de commande créé avec ses items
   */
  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await axiosInstance.post("/purchase-orders", dto);
    return response.data;
  },

  /**
   * Lister tous les bons de commande avec filtres optionnels.
   * 
   * @param params - Filtres (shopId, supplierId, status, page, limit)
   * @returns Liste paginée ou tableau de bons de commande
   */
  async getAll(params?: {
    shopId?: string;
    supplierId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const response = await axiosInstance.get("/purchase-orders", { params });
    return response.data;
  },

  /**
   * Récupérer les détails d'un bon de commande par son ID.
   * 
   * Inclut les items avec les quantités commandées vs reçues,
   * et les informations du fournisseur associé.
   * 
   * @param id - UUID du bon de commande
   * @returns Détail complet incluant items et fournisseur
   */
  async getById(id: string): Promise<PurchaseOrder> {
    const response = await axiosInstance.get(`/purchase-orders/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour le statut d'un bon de commande.
   * 
   * Transitions possibles :
   *   DRAFT → SENT (envoi au fournisseur)
   *   SENT → CANCELLED (annulation)
   *   PARTIAL → RECEIVED (tout a été reçu)
   *   * → CANCELLED (annulation à tout moment)
   * 
   * @param id - UUID du bon de commande
   * @param status - Nouveau statut
   * @returns Le bon de commande mis à jour
   */
  async updateStatus(id: string, status: string): Promise<PurchaseOrder> {
    const response = await axiosInstance.put(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Enregistrer la réception d'articles d'un bon de commande.
   * 
   * ⚠️ IMPORTANT : Cette action déclenche automatiquement :
   *   1. L'incrémentation du stock des produits concernés
   *   2. La création de mouvements de stock de type PURCHASE
   *   3. La mise à jour du statut vers PARTIAL ou RECEIVED
   * 
   * @param id - UUID du bon de commande
   * @param dto - Articles reçus (userId, items[{itemId, quantityReceived}])
   * @returns Le bon de commande mis à jour
   */
  async receiveItems(id: string, dto: ReceiveItemsDto): Promise<PurchaseOrder> {
    const response = await axiosInstance.post(`/purchase-orders/${id}/receive`, dto);
    return response.data;
  },
};

export default PurchaseOrderService;
