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
