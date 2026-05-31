import axiosInstance from "../../core/axios";
import { Category } from "../../types/quinc";

class QuincCategoryService {
  async getAll(shopId: string): Promise<Category[]> {
    try {
      const response = await axiosInstance.get("/categories", {
        params: { shopId },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
      throw error;
    }
  }

  async getByShop(shopId: string, params?: Record<string, unknown>): Promise<Category[]> {
    try {
      const response = await axiosInstance.get(`/categories/shop/${shopId}`, { params });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories par boutique:", error);
      throw error;
    }
  }

  async create(data: Partial<Category>): Promise<Category> {
    try {
      const response = await axiosInstance.post("/categories", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de la catégorie:", error);
      throw error;
    }
  }
}

export default new QuincCategoryService();
