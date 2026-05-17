/**
 * ============================================================================
 * SERVICE : DÉPENSES (Expenses)
 * ============================================================================
 * 
 * Gère les charges opérationnelles de la boutique :
 *   - Loyer, eau, électricité
 *   - Salaires du personnel
 *   - Transport, maintenance, taxes
 *   - Autres dépenses diverses
 * 
 * Les dépenses peuvent être récurrentes (loyer mensuel) ou ponctuelles.
 * Le backend supporte aussi la pièce justificative (receiptUrl).
 * 
 * ⚠️ IMPORTANT : Le backend exige maintenant les champs `shopId` et `userId`
 * dans chaque création de dépense. L'ancien service n'envoyait pas le `userId`.
 * 
 * Endpoints backend :
 *   POST   /api/v1/expenses      → Créer une dépense
 *   GET    /api/v1/expenses      → Lister avec filtres (shopId, category, startDate, endDate)
 *   GET    /api/v1/expenses/:id  → Détail
 *   PUT    /api/v1/expenses/:id  → Modifier
 *   DELETE /api/v1/expenses/:id  → Supprimer (nécessite userId en query)
 * 
 * @see back-spservice/src/modules/expense
 * ============================================================================
 */

import axiosInstance from "../core/axios";
import { 
  Expense, 
  CreateExpenseDto, 
  FilterExpenseDto, 
  ExpenseCategory 
} from "../types/super";

// Ré-exporter les types pour la compatibilité avec les imports existants
export type { Expense, CreateExpenseDto, FilterExpenseDto };
export { ExpenseCategory };

const ExpenseService = {
  /**
   * Lister toutes les dépenses avec filtres optionnels.
   * 
   * Le backend supporte les filtres suivants :
   *   - shopId     → Filtrer par boutique
   *   - category   → Filtrer par catégorie (RENT, SALARY, etc.)
   *   - startDate  → Date de début (format YYYY-MM-DD)
   *   - endDate    → Date de fin (format YYYY-MM-DD)
   * 
   * @param params - Filtres optionnels alignés sur FilterExpenseDto backend
   * @returns Liste des dépenses correspondant aux filtres
   */
  async getAll(params?: FilterExpenseDto) {
    const response = await axiosInstance.get("/expenses", { params });
    return response.data;
  },

  /**
   * Récupérer une dépense par son ID.
   * 
   * @param id - UUID de la dépense
   * @returns Détail complet de la dépense
   * @throws 404 si la dépense n'existe pas
   */
  async getById(id: string) {
    const response = await axiosInstance.get(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Créer une nouvelle dépense.
   * 
   * ⚠️ Les champs `title`, `category`, `amount`, `shopId` et `userId`
   * sont OBLIGATOIRES. Le backend renverra une erreur 400 si l'un manque.
   * 
   * @param data - Données de la dépense alignées sur CreateExpenseDto backend
   * @returns La dépense nouvellement créée
   */
  async create(data: CreateExpenseDto) {
    const response = await axiosInstance.post("/expenses", data);
    return response.data;
  },

  /**
   * Mettre à jour une dépense existante.
   * 
   * @param id - UUID de la dépense
   * @param data - Champs à modifier (partiel)
   * @returns La dépense mise à jour
   */
  async update(id: string, data: Partial<CreateExpenseDto>) {
    const response = await axiosInstance.put(`/expenses/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une dépense.
   * 
   * Le backend attend optionnellement un `userId` en query param
   * pour tracer l'auteur de la suppression dans les logs d'audit.
   * 
   * @param id - UUID de la dépense à supprimer
   * @param userId - UUID de l'utilisateur effectuant la suppression (optionnel)
   */
  async delete(id: string, userId?: string) {
    await axiosInstance.delete(`/expenses/${id}`, {
      params: userId ? { userId } : undefined,
    });
  },
};

export default ExpenseService;
