import axiosInstance from "../../core/axios";
import { Product } from "../../types/quinc";

/**
 * Service de gestion des Produits pour la Quincaillerie.
 * Ce service consomme les endpoints /products mais est configuré
 * pour pouvoir intégrer une logique spécifique à la quincaillerie si besoin.
 */
class QuincProductService {
  /**
   * Récupère tous les produits (matériaux) pour la boutique donnée.
   * @param shopId Identifiant de la quincaillerie
   * @returns Liste des produits
   */
  async getAll(shopId: string): Promise<Product[]> {
    try {
      let response;
      try {
        response = await axiosInstance.get("/products", {
          params: { shopId, limit: 1000 },
        });
      } catch (err) {
        console.warn("Retrying QuincProductService.getAll without limit due to backend error:", err);
        response = await axiosInstance.get("/products", {
          params: { shopId },
        });
      }
      // Le backend renvoie souvent les données dans .data.data avec pagination
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des matériaux:", error);
      throw error;
    }
  }

  /**
   * Crée un nouveau matériau dans le catalogue de la quincaillerie.
   * @param data Données du produit (nom, prix, unité, etc.)
   */
  async create(data: Partial<Product>): Promise<Product> {
    try {
      const response = await axiosInstance.post("/products", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du matériau:", error);
      throw error;
    }
  }

  /**
   * Met à jour les informations d'un matériau existant.
   * @param id Identifiant du produit
   * @param data Nouvelles données
   */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const response = await axiosInstance.patch(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la modification du matériau:", error);
      throw error;
    }
  }

  /**
   * Supprime un matériau du catalogue.
   * @param id Identifiant du produit à supprimer
   */
  async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/products/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression du matériau:", error);
      throw error;
    }
  }
}

export default new QuincProductService();
