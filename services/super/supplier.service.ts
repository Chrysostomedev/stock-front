/**
 * ============================================================================
 * SERVICE : FOURNISSEURS (Suppliers)
 * ============================================================================
 * 
 * Gère les fournisseurs de la superette — les entreprises ou personnes
 * qui approvisionnent la boutique en produits.
 * 
 * Un fournisseur peut être lié à des bons de commande (purchase-orders)
 * pour suivre les approvisionnements et les dettes fournisseur.
 * 
 * Endpoints backend :
 *   POST   /api/v1/suppliers      → Créer un fournisseur
 *   GET    /api/v1/suppliers      → Lister tous (avec pagination)
 *   GET    /api/v1/suppliers/:id  → Détail d'un fournisseur
 *   PUT    /api/v1/suppliers/:id  → Modifier un fournisseur
 *   DELETE /api/v1/suppliers/:id  → Supprimer un fournisseur
 * 
 * @see back-spservice/src/modules/supplier
 * ============================================================================
 */

import axiosInstance from "../../core/axios";
import { Supplier, CreateSupplierDto } from "../../types/super";

const SupplierService = {
  /**
   * Créer un nouveau fournisseur.
   * 
   * Le champ `name` est obligatoire (min 2 caractères, max 100).
   * Tous les autres champs sont optionnels.
   * 
   * @param dto - Données du fournisseur (name, contact?, phone?, email?, address?, notes?)
   * @returns Le fournisseur nouvellement créé
   */
  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const response = await axiosInstance.post("/suppliers", dto);
    return response.data;
  },

  /**
   * Récupérer tous les fournisseurs avec pagination optionnelle.
   * 
   * @param params - Filtres optionnels (page, limit, search, isActive)
   * @returns Liste paginée de fournisseurs ou tableau direct
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await axiosInstance.get("/suppliers", { params });
    return response.data;
  },

  /**
   * Récupérer un fournisseur par son ID.
   * 
   * @param id - UUID du fournisseur
   * @returns Détail complet du fournisseur
   * @throws 404 si le fournisseur n'existe pas
   */
  async getById(id: string): Promise<Supplier> {
    const response = await axiosInstance.get(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un fournisseur existant.
   * 
   * @param id - UUID du fournisseur
   * @param dto - Champs à mettre à jour (partiel)
   * @returns Le fournisseur mis à jour
   */
  async update(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    const response = await axiosInstance.put(`/suppliers/${id}`, dto);
    return response.data;
  },

  /**
   * Supprimer un fournisseur.
   * 
   * ⚠️ Attention : La suppression peut échouer si le fournisseur est lié
   * à des bons de commande existants (intégrité référentielle).
   * 
   * @param id - UUID du fournisseur
   * @returns Confirmation de suppression
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete(`/suppliers/${id}`);
    return response.data;
  },
};

export default SupplierService;
