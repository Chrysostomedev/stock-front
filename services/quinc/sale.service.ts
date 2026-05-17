import axiosInstance from "../../core/axios";
import { Sale } from "../../types/quinc";

class QuincSaleService {
  /**
   * Crée une nouvelle vente (Caisse ou Devis)
   */
  async create(data: Partial<Sale>): Promise<Sale> {
    try {
      const response = await axiosInstance.post("/sales", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de la vente:", error);
      throw error;
    }
  }

  /**
   * Récupère les ventes d'une quincaillerie avec des filtres (par défaut du jour)
   */
  async getAll(shopId: string, filters?: any): Promise<Sale[]> {
    try {
      const response = await axiosInstance.get("/sales", {
        params: { shopId, ...filters },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des ventes:", error);
      throw error;
    }
  }

  /**
   * Annule une vente (VOID)
   */
  async voidSale(id: string): Promise<Sale> {
    try {
      const response = await axiosInstance.patch(`/sales/${id}/void`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'annulation de la vente:", error);
      throw error;
    }
  }
}

export default new QuincSaleService();
