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
      const response = await axiosInstance.get("/products", {
        params: { shopId, limit: 1000 },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("QuincProductService.getAll with limit 1000 failed, trying auto-pagination fallback:", error);
      try {
        const firstPageResponse = await axiosInstance.get("/products", {
          params: { shopId, page: 1 },
        });
        
        const resData = firstPageResponse.data;
        const total = resData.total || 0;
        const limit = resData.limit || 10;
        const totalPages = resData.totalPages || Math.ceil(total / limit);
        
        const firstPageList = resData.data || resData;
        const allData = Array.isArray(firstPageList) ? [...firstPageList] : [];
        
        if (totalPages <= 1 || !Array.isArray(resData.data)) {
          return allData;
        }
        
        const pagePromises = [];
        for (let p = 2; p <= totalPages; p++) {
          pagePromises.push(
            axiosInstance.get("/products", { params: { shopId, page: p } })
          );
        }
        
        const pagesResults = await Promise.all(pagePromises);
        pagesResults.forEach((pageRes) => {
          const pageList = pageRes.data?.data || pageRes.data;
          if (Array.isArray(pageList)) {
            allData.push(...pageList);
          }
        });
        
        return allData;
      } catch (fallbackError) {
        console.error("Erreur lors de la récupération résiliente des matériaux:", fallbackError);
        return [];
      }
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
