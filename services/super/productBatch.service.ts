/**
 * ============================================================================
 * SERVICE : LOTS DE PRODUITS (Product Batches)
 * ============================================================================
 * 
 * Gère les lots (arrivages) de produits. Chaque lot possède :
 *   - Un numéro de lot unique (batchNumber)
 *   - Une quantité restante
 *   - Une date d'expiration (optionnelle, pour les produits périssables)
 *   - Un prix d'achat (pour le calcul de marge)
 * 
 * Ce service est crucial pour :
 *   1. La gestion des PÉRIMÉS → endpoint /expiring/:shopId
 *   2. La traçabilité FIFO → lots ordonnés par date de réception
 *   3. Le calcul de marge → prix d'achat vs prix de vente
 * 
 * Endpoints backend :
 *   POST   /api/v1/product-batches                    → Enregistrer un lot
 *   GET    /api/v1/product-batches/product/:productId → Lots d'un produit
 *   GET    /api/v1/product-batches/expiring/:shopId   → Lots expirant bientôt
 *   PUT    /api/v1/product-batches/:id                → Modifier un lot
 * 
 * @see back-spservice/src/modules/product-batch
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import { ProductBatch, CreateProductBatchDto } from "../../types/super";

const ProductBatchService = {
  /**
   * Enregistrer un nouveau lot (arrivage) pour un produit.
   * 
   * Appelé lors de la réception d'une livraison fournisseur.
   * Le backend incrémente automatiquement le stock du produit.
   * 
   * @param dto - Données du lot (productId, batchNumber, quantity, buyingPrice, expiresAt?, receivedAt?)
   * @returns Le lot nouvellement créé
   */
  async create(dto: CreateProductBatchDto): Promise<ProductBatch> {
    const response = await axiosInstance.post("/product-batches", dto);
    return response.data;
  },

  /**
   * Récupérer tous les lots d'un produit spécifique.
   * 
   * Utile pour voir l'historique des arrivages et les dates d'expiration
   * de chaque lot d'un même produit.
   * 
   * @param productId - UUID du produit
   * @returns Liste des lots ordonnés par date de réception
   */
  async getByProduct(productId: string): Promise<ProductBatch[]> {
    const response = await axiosInstance.get(`/product-batches/product/${productId}`);
    return response.data;
  },

  /**
   * 🔴 Récupérer les lots arrivant à expiration pour une boutique.
   * 
   * C'est l'endpoint clé de la page "Pertes & Périmés".
   * Le backend filtre automatiquement les lots dont la date d'expiration
   * est dans les `days` prochains jours.
   * 
   * @param shopId - UUID de la boutique
   * @param days - Nombre de jours avant expiration (défaut: 30)
   * @returns Liste des lots expirant bientôt
   */
  async getExpiring(shopId: string, days: number = 30): Promise<ProductBatch[]> {
    const response = await axiosInstance.get(`/product-batches/expiring/${shopId}`, {
      params: { days },
    });
    return response.data;
  },

  /**
   * Mettre à jour un lot existant (quantité, prix, etc.).
   * 
   * Utilisé pour :
   *   - Déclarer des pertes (réduction de quantité)
   *   - Corriger un prix d'achat erroné
   *   - Modifier la date d'expiration
   * 
   * @param id - UUID du lot
   * @param dto - Champs à mettre à jour (partiel)
   * @returns Le lot mis à jour
   */
  async update(id: string, dto: Partial<CreateProductBatchDto>): Promise<ProductBatch> {
    const response = await axiosInstance.put(`/product-batches/${id}`, dto);
    return response.data;
  },
};

export default ProductBatchService;
