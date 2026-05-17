import axiosInstance from "../../core/axios";
import { Expense } from "../../types/quinc";

class QuincExpenseService {
  async getAll(shopId: string): Promise<Expense[]> {
    try {
      const response = await axiosInstance.get("/expenses", {
        params: { shopId },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des dépenses:", error);
      throw error;
    }
  }

  async create(data: Partial<Expense>): Promise<Expense> {
    try {
      const response = await axiosInstance.post("/expenses", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de la dépense:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    try {
      const response = await axiosInstance.patch(`/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la dépense:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/expenses/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression de la dépense:", error);
      throw error;
    }
  }
}

export default new QuincExpenseService();
